import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:noise_meter/noise_meter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/database/local_db_manager.dart';
import '../../data/models/exam_model.dart';

class ExamRoomPage extends StatefulWidget {
  final int sessionId;
  final ExamModel exam;

  const ExamRoomPage({
    super.key,
    required this.sessionId,
    required this.exam,
  });

  @override
  State<ExamRoomPage> createState() => _ExamRoomPageState();
}

class _ExamRoomPageState extends State<ExamRoomPage> with WidgetsBindingObserver {
  // Soru Listesi
  List<dynamic> _questions = [];
  int _currentQuestionIndex = 0;
  bool _isLoadingQuestions = true;
  String _errorLoading = '';

  // Cevap Durumu
  final Map<int, dynamic> _selectedAnswers = {}; // questionId -> optionId veya text
  final Map<int, bool> _savingStatus = {}; // questionId -> isSaving

  // Sayaç Durumu
  late int _remainingSeconds;
  Timer? _countdownTimer;

  // Kamera Durumu
  CameraController? _cameraController;
  bool _isCameraInitialized = false;

  // Yapay Zeka & Gözetim (Proctoring)
  late FaceDetector _faceDetector;
  bool _isProcessingImage = false;
  DateTime _lastImageProcessedTime = DateTime.now();
  
  // Ses İzleme
  NoiseMeter? _noiseMeter;
  StreamSubscription<NoiseReading>? _noiseSubscription;
  DateTime _lastNoiseLogTime = DateTime.now();

  // Ekran Odağı İzleme
  DateTime _lastAppFocusLogTime = DateTime.now();

  // İnternet Durumu & Çevrimdışı Yönetim
  bool _isOnline = true;
  bool _isSyncing = false;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  // Canlı Oturum Durumu ve Uyarı Takibi
  Timer? _sessionPollingTimer;
  String _sessionStatus = 'ONGOING';
  int? _lastSeenWarningId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _remainingSeconds = widget.exam.duration * 60;
    _startCountdown();
    _fetchQuestions();
    _initializeProctoring();
    _setupConnectivity();
    _startSessionPolling();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _countdownTimer?.cancel();
    _sessionPollingTimer?.cancel();
    _cameraController?.dispose();
    _faceDetector.close();
    _noiseSubscription?.cancel();
    _connectivitySubscription?.cancel();
    super.dispose();
  }

  // Geri Sayım Başlat
  void _startCountdown() {
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds > 0) {
        setState(() {
          _remainingSeconds--;
        });
      } else {
        _countdownTimer?.cancel();
        _autoSubmitExam();
      }
    });
  }

  // Canlı Oturum Durumu ve Akademisyen Uyarı Takibi (Poller)
  void _startSessionPolling() {
    _sessionPollingTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (_isLoadingQuestions || !_isOnline) return;
      _pollSessionStatus();
    });
  }

  Future<void> _pollSessionStatus() async {
    final client = context.read<DioClient>();
    try {
      final path = ApiConstants.getSession.replaceAll('{sessionId}', widget.sessionId.toString());
      final response = await client.get(path);
      final data = response.data as Map<String, dynamic>;
      
      final String status = data['status'] as String? ?? 'ONGOING';
      final List<dynamic> logs = data['logs'] as List<dynamic>? ?? [];

      if (mounted) {
        setState(() {
          _sessionStatus = status;
        });

        // Akademisyen tarafından yeni bir uyarı gönderildiyse ekranda göster
        if (logs.isNotEmpty) {
          final warningLog = logs[0] as Map<String, dynamic>;
          final warningId = warningLog['id'] as int;
          final description = warningLog['description'] as String? ?? '';

          if (_lastSeenWarningId != warningId) {
            _lastSeenWarningId = warningId;
            _showWarningDialog(description);
          }
        }
      }
    } catch (_) {}
  }

  void _showWarningDialog(String message) {
    // Akademisyen uyarısı kısmını temizleyip gösterelim
    final cleanMessage = message.replaceAll('Akademisyen uyarısı: ', '').replaceAll('"', '');
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: AppTheme.errorRed),
            SizedBox(width: 8),
            Text('Gözetmen Uyarısı', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text(cleanMessage, style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.4)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Anladım', style: TextStyle(color: AppTheme.accentGold, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // Soruları Backend'den Çek
  Future<void> _fetchQuestions() async {
    final client = context.read<DioClient>();
    try {
      await client.post(
        ApiConstants.startSession.replaceAll('{examId}', widget.exam.id.toString()),
      );
      
      // Sınav altındaki soruları çek
      final examResponse = await client.get(
        '/exams/${widget.exam.id}',
      );
      
      final examData = examResponse.data as Map<String, dynamic>;
      final questionsList = examData['questions'] as List<dynamic>? ?? [];

      setState(() {
        _questions = questionsList;
        _isLoadingQuestions = false;
      });
      
      // Çevrimdışıyken işaretlenmiş yerel cevapları yükle
      _loadBufferedAnswers();
    } catch (e) {
      setState(() {
        _errorLoading = e.toString().replaceAll('Exception: ', '');
        _isLoadingQuestions = false;
      });
    }
  }

  // Gözetim Altyapısını Başlat
  Future<void> _initializeProctoring() async {
    _faceDetector = FaceDetector(
      options: FaceDetectorOptions(
        performanceMode: FaceDetectorMode.fast,
      ),
    );

    _startNoiseMonitoring();
    _initializeCamera();
  }

  // Kamerayı Başlat ve Görüntü Akışını Dinle
  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      final frontCamera = cameras.firstWhere(
        (cam) => cam.lensDirection == CameraLensDirection.front,
      );

      _cameraController = CameraController(
        frontCamera,
        ResolutionPreset.low,
        enableAudio: false,
      );

      await _cameraController!.initialize();
      if (mounted) {
        setState(() {
          _isCameraInitialized = true;
        });
        
        _cameraController!.startImageStream((CameraImage image) {
          _processCameraImage(image);
        });
      }
    } catch (_) {}
  }

  // Kamera Görüntüsünü Yapay Zeka ile İşle
  Future<void> _processCameraImage(CameraImage image) async {
    if (_isProcessingImage || !_isCameraInitialized) return;

    final now = DateTime.now();
    if (now.difference(_lastImageProcessedTime).inMilliseconds < 1500) {
      return;
    }

    _isProcessingImage = true;
    _lastImageProcessedTime = now;

    try {
      final WriteBuffer allBytes = WriteBuffer();
      for (final Plane plane in image.planes) {
        allBytes.putUint8List(plane.bytes);
      }
      final bytes = allBytes.done().buffer.asUint8List();

      final imageRotation = InputImageRotationValue.fromRawValue(270) ?? InputImageRotationValue.fromRawValue(0)!;
      final imageFormat = InputImageFormatValue.fromRawValue(image.format.raw) ?? InputImageFormat.nv21;
      
      final metadata = InputImageMetadata(
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: imageRotation,
        format: imageFormat,
        bytesPerRow: image.planes[0].bytesPerRow,
      );

      final inputImage = InputImage.fromBytes(bytes: bytes, metadata: metadata);
      final faces = await _faceDetector.processImage(inputImage);

      if (faces.isEmpty) {
        _logBiometricViolation('FACE', 'NO_FACE');
      } else if (faces.length > 1) {
        _logBiometricViolation('FACE', 'MULTIPLE_FACES');
      }
    } catch (_) {
    } finally {
      _isProcessingImage = false;
    }
  }

  // Ses İzleme
  void _startNoiseMonitoring() {
    try {
      _noiseMeter = NoiseMeter();
      _noiseSubscription = _noiseMeter!.noise.listen((NoiseReading reading) {
        final db = reading.meanDecibel;
        if (db > 75.0) {
          final now = DateTime.now();
          if (now.difference(_lastNoiseLogTime).inSeconds > 10) {
            _lastNoiseLogTime = now;
            _logBiometricViolation('VOICE', 'VOICE_DETECTED');
          }
        }
      }, onError: (_) {});
    } catch (_) {}
  }

  // Uygulamadan Çıkma / Arka Plana Geçme Takibi
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      final now = DateTime.now();
      if (now.difference(_lastAppFocusLogTime).inSeconds > 5) {
        _lastAppFocusLogTime = now;
        _logBiometricViolation('SCREEN', 'TAB_SWITCH');
      }
    }
  }

  // İnternet Durumunu İzle
  void _setupConnectivity() {
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen((List<ConnectivityResult> results) {
      final hasConn = results.any((res) => res != ConnectivityResult.none);
      
      setState(() {
        _isOnline = hasConn;
      });

      if (hasConn) {
        // İnternet geri geldiğinde yerel kuyruğu senkronize et
        _syncOfflineData();
      }
    });
  }

  // Çevrimdışıyken kaydedilen yerel cevapları belleğe yükle (UI senkronu için)
  void _loadBufferedAnswers() {
    final rawAnswers = LocalDbManager.getString('offline_answers');
    if (rawAnswers != null) {
      try {
        final list = jsonDecode(rawAnswers) as List<dynamic>;
        for (final item in list) {
          final qId = item['questionId'] as int;
          final optId = item['optionId'];
          final textAns = item['textAnswer'];
          
          setState(() {
            _selectedAnswers[qId] = optId ?? textAns;
          });
        }
      } catch (_) {}
    }
  }

  // Cevabı Yerel Depoda Tamponla
  Future<void> _bufferAnswerLocally(int questionId, Map<String, dynamic> payload) async {
    final rawAnswers = LocalDbManager.getString('offline_answers');
    List<dynamic> list = [];
    if (rawAnswers != null) {
      try {
        list = jsonDecode(rawAnswers) as List<dynamic>;
      } catch (_) {}
    }

    // Eski cevabı varsa listeden çıkar
    list.removeWhere((item) => item['questionId'] == questionId);
    list.add(payload);
    
    await LocalDbManager.setString('offline_answers', jsonEncode(list));

    // UI'da kaydedildi olarak göster
    setState(() {
      _savingStatus[questionId] = false;
    });
  }

  // Biyometrik İhlali Yerelde Tamponla
  Future<void> _bufferBiometricLocally(Map<String, dynamic> payload) async {
    final rawBiometrics = LocalDbManager.getString('offline_biometrics');
    List<dynamic> list = [];
    if (rawBiometrics != null) {
      try {
        list = jsonDecode(rawBiometrics) as List<dynamic>;
      } catch (_) {}
    }

    list.add(payload);
    await LocalDbManager.setString('offline_biometrics', jsonEncode(list));
  }

  // İhlalleri Sunucuya Kaydet
  Future<void> _logBiometricViolation(String type, String status) async {
    if (_questions.isEmpty) return;
    final questionId = _questions[_currentQuestionIndex]['id'] as int;
    
    final payload = {
      'sessionId': widget.sessionId,
      'questionId': questionId,
      'type': type,
      'status': status,
      'photoUrl': null,
      'screenshotUrl': null,
    };

    if (!_isOnline) {
      await _bufferBiometricLocally(payload);
      return;
    }

    final client = context.read<DioClient>();
    try {
      await client.post(
        ApiConstants.logBiometrics,
        data: payload,
      );
    } catch (_) {
      await _bufferBiometricLocally(payload);
    }
  }

  // Cevabı Kaydet (Anlık Gönderim)
  Future<void> _saveAnswer(int questionId, dynamic answerValue) async {
    setState(() {
      _selectedAnswers[questionId] = answerValue;
    });

    final isMultipleChoice = answerValue is int;
    final answerPayload = {
      'questionId': questionId,
      if (isMultipleChoice) 'optionId': answerValue,
      if (!isMultipleChoice) 'textAnswer': answerValue.toString(),
    };

    if (!_isOnline) {
      await _bufferAnswerLocally(questionId, answerPayload);
      return;
    }

    setState(() {
      _savingStatus[questionId] = true;
    });

    final client = context.read<DioClient>();
    try {
      final submitPath = ApiConstants.submitAnswer.replaceAll('{examId}', widget.exam.id.toString());
      await client.post(
        submitPath,
        data: answerPayload,
      );

      if (mounted) {
        setState(() {
          _savingStatus[questionId] = false;
        });
      }
    } catch (_) {
      // API hatası durumunda yerelde tamponla
      await _bufferAnswerLocally(questionId, answerPayload);
      if (mounted) {
        setState(() {
          _savingStatus[questionId] = false;
        });
      }
    }
  }

  // Çevrimdışı Verileri Senkronize Et (Sync Queue)
  Future<void> _syncOfflineData() async {
    if (_isSyncing || !_isOnline) return;
    _isSyncing = true;

    final client = context.read<DioClient>();

    // 1. Cevapları eşitle
    final rawAnswers = LocalDbManager.getString('offline_answers');
    if (rawAnswers != null) {
      try {
        final list = jsonDecode(rawAnswers) as List<dynamic>;
        final remaining = List.from(list);

        final submitPath = ApiConstants.submitAnswer.replaceAll('{examId}', widget.exam.id.toString());
        
        for (final payload in list) {
          try {
            await client.post(submitPath, data: payload);
            remaining.remove(payload);
          } catch (_) {
            break; // Bağlantı koptuysa eşitlemeyi yarıda kes
          }
        }

        if (remaining.isEmpty) {
          await LocalDbManager.remove('offline_answers');
        } else {
          await LocalDbManager.setString('offline_answers', jsonEncode(remaining));
        }
      } catch (_) {}
    }

    // 2. İhlalleri eşitle
    final rawBiometrics = LocalDbManager.getString('offline_biometrics');
    if (rawBiometrics != null) {
      try {
        final list = jsonDecode(rawBiometrics) as List<dynamic>;
        final remaining = List.from(list);

        for (final payload in list) {
          try {
            await client.post(ApiConstants.logBiometrics, data: payload);
            remaining.remove(payload);
          } catch (_) {
            break;
          }
        }

        if (remaining.isEmpty) {
          await LocalDbManager.remove('offline_biometrics');
        } else {
          await LocalDbManager.setString('offline_biometrics', jsonEncode(remaining));
        }
      } catch (_) {}
    }

    _isSyncing = false;
  }

  // Sınavı Tamamla
  Future<void> _submitExam() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceDark,
        title: const Text('Sınavı Bitir'),
        content: const Text('Sınavı sonlandırmak ve cevaplarınızı göndermek istediğinize emin misiniz? Bu işlem geri alınamaz.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Vazgeç', style: TextStyle(color: AppTheme.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Evet, Bitir', style: TextStyle(color: AppTheme.successGreen, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      _executeSubmit();
    }
  }

  // Zaman bittiğinde otomatik tamamlama
  void _autoSubmitExam() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Sınav süresi sona erdi! Cevaplarınız otomatik gönderiliyor...'),
        backgroundColor: AppTheme.warningOrange,
      ),
    );
    _executeSubmit();
  }

  Future<void> _executeSubmit() async {
    final client = context.read<DioClient>();
    setState(() => _isLoadingQuestions = true);
    
    // Senkronize edilmemiş yerel cevaplar varsa önce onları zorla eşitle
    await _syncOfflineData();
    try {
      final endPath = ApiConstants.endSession.replaceAll('{examId}', widget.exam.id.toString());
      await client.post(endPath);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Sınav başarıyla tamamlandı!'),
            backgroundColor: AppTheme.successGreen,
          ),
        );
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingQuestions = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Sınav sonlandırılırken hata oluştu: ${e.toString()}'),
            backgroundColor: AppTheme.errorRed,
          ),
        );
      }
    }
  }

  String _getFormattedTime() {
    final minutes = (_remainingSeconds / 60).floor().toString().padLeft(2, '0');
    final seconds = (_remainingSeconds % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingQuestions) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: AppTheme.accentGold),
        ),
      );
    }

    if (_sessionStatus == 'SUSPENDED') {
      return Scaffold(
        backgroundColor: AppTheme.bgDark,
        body: Center(
          child: Container(
            margin: const EdgeInsets.all(24),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppTheme.surfaceDark,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppTheme.warningOrange, width: 1.5),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.pause_circle_outline,
                  color: AppTheme.warningOrange,
                  size: 64,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Sınavınız Duraklatıldı',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Sınav gözetmeniniz tarafından bu oturum askıya alınmıştır. Lütfen gözetmeninizin talimatlarına uyunuz.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 12, height: 1.5),
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppTheme.warningOrange.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text(
                    'Durum: SUSPENDED (Askıda)',
                    style: TextStyle(color: AppTheme.warningOrange, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_errorLoading.isNotEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Sınav Odası')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, color: AppTheme.errorRed, size: 54),
                const SizedBox(height: 16),
                Text(_errorLoading, style: const TextStyle(color: Colors.white), textAlign: TextAlign.center),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _isLoadingQuestions = true;
                      _errorLoading = '';
                    });
                    _fetchQuestions();
                  },
                  child: const Text('Tekrar Dene'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final question = _questions[_currentQuestionIndex];
    final questionId = question['id'] as int;
    final options = question['options'] as List<dynamic>? ?? [];
    final questionText = question['text'] as String? ?? '';
    final isSaving = _savingStatus[questionId] ?? false;

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: Text(widget.exam.title, style: const TextStyle(fontSize: 14)),
        actions: [
          // Dairesel Geri Sayım Sayacı
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            margin: const EdgeInsets.only(right: 12),
            decoration: BoxDecoration(
              color: _remainingSeconds < 120 ? AppTheme.errorRed.withValues(alpha: 0.2) : Colors.black26,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _remainingSeconds < 120 ? AppTheme.errorRed : AppTheme.accentGold,
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Icon(Icons.timer, size: 14, color: _remainingSeconds < 120 ? AppTheme.errorRed : AppTheme.accentGold),
                const SizedBox(width: 6),
                Text(
                  _getFormattedTime(),
                  style: TextStyle(
                    color: _remainingSeconds < 120 ? AppTheme.errorRed : Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.exit_to_app, color: AppTheme.errorRed),
            onPressed: _submitExam,
          )
        ],
      ),
      body: Stack(
        children: [
          // Çevrimdışı Uyarı Barı
          if (!_isOnline)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Container(
                color: AppTheme.errorRed,
                padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.wifi_off, color: Colors.white, size: 14),
                    SizedBox(width: 8),
                    Text(
                      'İnternet bağlantınız koptu. Cevaplarınız cihaza güvenle yedekleniyor.',
                      style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),

          // Soru İçerik Alanı
          Padding(
            padding: EdgeInsets.only(bottom: 80, left: 16, right: 16, top: !_isOnline ? 40 : 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Soru ${_currentQuestionIndex + 1} / ${_questions.length}',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.accentGold),
                    ),
                    if (isSaving)
                      const Row(
                        children: [
                          SizedBox(
                            width: 10,
                            height: 10,
                            child: CircularProgressIndicator(strokeWidth: 1.5, color: AppTheme.accentGold),
                          ),
                          SizedBox(width: 6),
                          Text('Kaydediliyor...', style: TextStyle(color: AppTheme.textSecondary, fontSize: 10)),
                        ],
                      )
                    else if (_selectedAnswers.containsKey(questionId))
                      const Row(
                        children: [
                          Icon(Icons.check_circle, color: AppTheme.successGreen, size: 12),
                          SizedBox(width: 4),
                          Text('Kaydedildi', style: TextStyle(color: AppTheme.successGreen, fontSize: 10)),
                        ],
                      )
                  ],
                ),
                const SizedBox(height: 16),

                // Soru Metni Kartı
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceDark,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF334155), width: 0.8),
                  ),
                  child: Text(
                    questionText,
                    style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.5, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 20),

                // Şıklar
                Expanded(
                  child: ListView(
                    children: options.map((opt) {
                      final optId = opt['id'] as int;
                      final optText = opt['text'] as String? ?? '';
                      final isSelected = _selectedAnswers[questionId] == optId;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: isSelected ? AppTheme.primaryNavy.withValues(alpha: 0.3) : AppTheme.surfaceDark,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected ? AppTheme.accentGold : const Color(0xFF334155),
                            width: isSelected ? 1.2 : 0.8,
                          ),
                        ),
                        child: ListTile(
                          onTap: () => _saveAnswer(questionId, optId),
                          leading: Container(
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isSelected ? AppTheme.accentGold : Colors.transparent,
                              border: Border.all(
                                color: isSelected ? AppTheme.accentGold : const Color(0xFF64748B),
                                width: 1.5,
                              ),
                            ),
                            child: isSelected
                                ? const Icon(Icons.check, size: 14, color: AppTheme.primaryNavy)
                                : null,
                          ),
                          title: Text(
                            optText,
                            style: TextStyle(
                              color: isSelected ? Colors.white : AppTheme.textSecondary,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          // Alt Soru Navigasyon Çubuğu
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              color: AppTheme.surfaceDark,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  ElevatedButton(
                    onPressed: _currentQuestionIndex > 0
                        ? () {
                            setState(() {
                              _currentQuestionIndex--;
                            });
                          }
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      side: const BorderSide(color: Color(0xFF334155)),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.arrow_back_ios, size: 14),
                        SizedBox(width: 4),
                        Text('Önceki'),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: _currentQuestionIndex < _questions.length - 1
                        ? () {
                            setState(() {
                              _currentQuestionIndex++;
                            });
                          }
                        : _submitExam,
                    child: Row(
                      children: [
                        Text(_currentQuestionIndex == _questions.length - 1 ? 'Sınavı Bitir' : 'Sonraki'),
                        const SizedBox(width: 4),
                        Icon(
                          _currentQuestionIndex == _questions.length - 1 ? Icons.exit_to_app : Icons.arrow_forward_ios,
                          size: 14,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Floating Kamera Önizlemesi (Sağ Üstte)
          if (_isCameraInitialized && _cameraController != null)
            Positioned(
              top: 10,
              right: 10,
              child: Container(
                width: 72,
                height: 96,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.accentGold, width: 1.5),
                  boxShadow: const [
                    BoxShadow(color: Colors.black45, blurRadius: 8, offset: Offset(0, 4)),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: CameraPreview(_cameraController!),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
