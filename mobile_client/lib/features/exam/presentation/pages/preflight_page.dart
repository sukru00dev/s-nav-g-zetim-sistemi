import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../data/models/exam_model.dart';
import 'exam_room_page.dart';

class PreflightPage extends StatefulWidget {
  final ExamModel exam;

  const PreflightPage({super.key, required this.exam});

  @override
  State<PreflightPage> createState() => _PreflightPageState();
}

class _PreflightPageState extends State<PreflightPage> with WidgetsBindingObserver {
  bool _cameraPermissionGranted = false;
  bool _microphonePermissionGranted = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _checkPermissions();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Kullanıcı ayarlara gidip izin verip dönerse tekrar kontrol et
    if (state == AppLifecycleState.resumed) {
      _checkPermissions();
    }
  }

  Future<void> _checkPermissions() async {
    setState(() => _isLoading = true);
    
    final cameraStatus = await Permission.camera.status;
    final microphoneStatus = await Permission.microphone.status;

    setState(() {
      _cameraPermissionGranted = cameraStatus.isGranted;
      _microphonePermissionGranted = microphoneStatus.isGranted;
      _isLoading = false;
    });
  }

  Future<void> _requestCameraPermission() async {
    final status = await Permission.camera.request();
    setState(() {
      _cameraPermissionGranted = status.isGranted;
    });
    if (status.isPermanentlyDenied) {
      _showSettingsDialog('Kamera');
    }
  }

  Future<void> _requestMicrophonePermission() async {
    final status = await Permission.microphone.request();
    setState(() {
      _microphonePermissionGranted = status.isGranted;
    });
    if (status.isPermanentlyDenied) {
      _showSettingsDialog('Mikrofon');
    }
  }

  void _showSettingsDialog(String permissionName) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceDark,
        title: Text('$permissionName İzni Gerekli'),
        content: Text(
          'Sınav gözetimi için $permissionName izni kalıcı olarak reddedilmiş. Lütfen ayarlardan izin verin.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Vazgeç', style: TextStyle(color: AppTheme.textSecondary)),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              openAppSettings();
            },
            child: const Text('Ayarları Aç', style: TextStyle(color: AppTheme.accentGold, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final allGranted = _cameraPermissionGranted && _microphonePermissionGranted;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sınav Giriş Kontrolü'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.accentGold))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Sınav Bilgileri Kartı
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceDark,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF334155), width: 0.8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.exam.title,
                          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.timer_outlined, color: AppTheme.accentGold, size: 14),
                            const SizedBox(width: 6),
                            Text(
                              'Süre: ${widget.exam.duration} Dakika',
                              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  const Text(
                    'GEREKLİ İZİNLER VE DONANIM KONTROLÜ',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.0,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Kamera İzni Satırı
                  _buildChecklistItem(
                    title: 'Kamera İzni',
                    subtitle: 'Yapay zeka yüz gözetimi için ön kamera gereklidir.',
                    isGranted: _cameraPermissionGranted,
                    onRequest: _requestCameraPermission,
                  ),
                  const SizedBox(height: 12),

                  // Mikrofon İzni Satırı
                  _buildChecklistItem(
                    title: 'Mikrofon İzni',
                    subtitle: 'Ortam ses analizi gözetimi için mikrofon gereklidir.',
                    isGranted: _microphonePermissionGranted,
                    onRequest: _requestMicrophonePermission,
                  ),
                  const SizedBox(height: 24),

                  // Sınav Kuralları Hatırlatma
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.errorRed.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.errorRed.withValues(alpha: 0.2)),
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.warning_amber_rounded, color: AppTheme.errorRed, size: 18),
                            SizedBox(width: 8),
                            Text(
                              'Önemli Güvenlik Kuralları',
                              style: TextStyle(color: AppTheme.errorRed, fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        SizedBox(height: 10),
                        Text(
                          '• Sınav boyunca kameranız açık ve yüzünüz tam görünür olmalıdır.\n'
                          '• Uygulamadan ayrılmak, arka plana atmak, ekran kaydı veya ekran görüntüsü almak doğrudan ihlal olarak kaydedilir.\n'
                          '• Ortamda gürültü olmamasına dikkat ediniz.',
                          style: TextStyle(color: AppTheme.textSecondary, fontSize: 11, height: 1.6),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Sınava Başla Butonu
                  ElevatedButton(
                    onPressed: allGranted
                        ? () async {
                            setState(() => _isLoading = true);
                            final client = context.read<DioClient>();
                            try {
                              final response = await client.post(
                                ApiConstants.startSession.replaceAll('{examId}', widget.exam.id.toString()),
                              );
                              final data = response.data as Map<String, dynamic>;
                              final session = data['session'] as Map<String, dynamic>;
                              final sessionId = session['id'] as int;

                              if (!context.mounted) return;
                              Navigator.of(context).pushReplacement(
                                MaterialPageRoute<void>(
                                  builder: (_) => ExamRoomPage(
                                    sessionId: sessionId,
                                    exam: widget.exam,
                                  ),
                                ),
                              );
                            } catch (e) {
                              if (!context.mounted) return;
                              setState(() => _isLoading = false);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Sınav başlatılamadı: ${e.toString().replaceAll('Exception: ', '')}'),
                                  backgroundColor: AppTheme.errorRed,
                                ),
                              );
                            }
                          }
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: allGranted ? AppTheme.successGreen : Colors.grey[700],
                      foregroundColor: Colors.white,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('Sınava Başla'),
                        const SizedBox(width: 8),
                        Icon(allGranted ? Icons.play_arrow : Icons.lock_outline, size: 18),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildChecklistItem({
    required String title,
    required String subtitle,
    required bool isGranted,
    required VoidCallback onRequest,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceDark,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isGranted ? AppTheme.successGreen.withValues(alpha: 0.3) : const Color(0xFF334155),
          width: isGranted ? 1.2 : 0.8,
        ),
      ),
      child: Row(
        children: [
          Icon(
            isGranted ? Icons.check_circle : Icons.cancel_outlined,
            color: isGranted ? AppTheme.successGreen : AppTheme.errorRed,
            size: 24,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(color: AppTheme.textSecondary, fontSize: 10),
                ),
              ],
            ),
          ),
          if (!isGranted)
            ElevatedButton(
              onPressed: onRequest,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.accentGold,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('İzin Ver', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            ),
        ],
      ),
    );
  }
}
