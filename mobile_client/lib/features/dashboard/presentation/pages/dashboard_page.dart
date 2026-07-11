import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/dio_client.dart';
import '../../../auth/presentation/cubit/auth_cubit.dart';
import '../../../auth/presentation/cubit/auth_state.dart';
import '../../../exam/data/models/exam_model.dart';
import '../../../exam/presentation/cubit/exam_cubit.dart';
import '../../../exam/presentation/cubit/exam_state.dart';
import '../../../../features/exam/presentation/pages/preflight_page.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  int _currentIndex = 0;

  // Sonuçlar durumu
  bool _isLoadingResults = false;
  List<dynamic> _results = [];
  String _resultsError = '';

  @override
  void initState() {
    super.initState();
    // Sayfa açıldığında sınavları ve sonuçları yükle
    context.read<ExamCubit>().loadExams();
    _fetchResults();
  }

  String _formatDateTime(DateTime dt) {
    return DateFormat('dd MMMM yyyy, HH:mm', 'tr_TR').format(dt);
  }

  String _formatIsoString(String? isoString) {
    if (isoString == null) return '-';
    try {
      final dt = DateTime.parse(isoString);
      return DateFormat('dd MMMM yyyy, HH:mm', 'tr_TR').format(dt);
    } catch (_) {
      return isoString;
    }
  }

  String _getInitials(String studentName) {
    String initials = '';
    if (studentName.isNotEmpty) {
      final parts = studentName.split(' ');
      if (parts.isNotEmpty) {
        initials += parts[0][0].toUpperCase();
        if (parts.length > 1 && parts[parts.length - 1].isNotEmpty) {
          initials += parts[parts.length - 1][0].toUpperCase();
        }
      }
    }
    return initials.isEmpty ? 'ÖG' : initials;
  }

  // Sonuç verilerini çek
  Future<void> _fetchResults() async {
    if (!mounted) return;
    setState(() {
      _isLoadingResults = true;
      _resultsError = '';
    });
    try {
      final client = context.read<DioClient>();
      final response = await client.get('/users/me/sessions');
      final data = response.data as List<dynamic>;
      if (mounted) {
        setState(() {
          _results = data;
          _isLoadingResults = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _resultsError = 'Sonuçlar yüklenemedi: ${e.toString().replaceAll('Exception: ', '')}';
          _isLoadingResults = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Image.asset(
                'assets/images/logo.png',
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) => const Icon(Icons.school, size: 20, color: AppTheme.primaryNavy),
              ),
            ),
            const SizedBox(width: 10),
            Text(
              _currentIndex == 0
                  ? 'Öğrenci Sınav Paneli'
                  : _currentIndex == 1
                      ? 'Sınav Sonuçlarım'
                      : 'Profil Bilgilerim',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () {
              if (_currentIndex == 0) {
                context.read<ExamCubit>().loadExams();
              } else if (_currentIndex == 1) {
                _fetchResults();
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: _showLogoutDialog,
          ),
        ],
      ),
      body: BlocBuilder<AuthCubit, AuthState>(
        builder: (context, authState) {
          String studentName = 'Öğrenci';
          if (authState is AuthAuthenticated) {
            studentName = '${authState.user.forename} ${authState.user.surname}'.trim();
            if (studentName.isEmpty) {
              studentName = authState.user.username;
            }
          }

          // Seçili taba göre ilgili sayfayı göster
          if (_currentIndex == 0) {
            return _buildExamsTab(studentName);
          } else if (_currentIndex == 1) {
            return _buildResultsTab();
          } else {
            return _buildProfileTab(authState, studentName);
          }
        },
      ),
      // Alt Navigasyon Çubuğu (Bottom Navigation Bar)
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          selectedItemColor: AppTheme.primaryBlue,
          unselectedItemColor: AppTheme.textMuted,
          backgroundColor: Colors.white,
          type: BottomNavigationBarType.fixed,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
            if (index == 1) {
              _fetchResults();
            }
          },
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.assignment_outlined),
              activeIcon: Icon(Icons.assignment),
              label: 'Sınavlar',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.analytics_outlined),
              activeIcon: Icon(Icons.analytics),
              label: 'Sonuçlar',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Profil',
            ),
          ],
        ),
      ),
    );
  }

  // 1. SINAVLAR SEKMESİ
  Widget _buildExamsTab(String studentName) {
    final initials = _getInitials(studentName);

    return RefreshIndicator(
      onRefresh: () => context.read<ExamCubit>().loadExams(),
      color: AppTheme.primaryBlue,
      backgroundColor: Colors.white,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Premium Karşılama Kartı
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0), width: 1.0),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundColor: AppTheme.primaryBlue.withValues(alpha: 0.08),
                    child: Text(
                      initials,
                      style: const TextStyle(
                        color: AppTheme.primaryBlue,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Hoş Geldiniz,',
                          style: TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          studentName,
                          style: const TextStyle(
                            color: AppTheme.primaryNavy,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.successGreen.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.successGreen.withValues(alpha: 0.15)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.shield_outlined, color: AppTheme.successGreen, size: 12),
                        SizedBox(width: 4),
                        Text(
                          'Gözetim Aktif',
                          style: TextStyle(color: AppTheme.successGreen, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'Aktif ve Yaklaşan Sınavlar',
              style: TextStyle(
                color: AppTheme.primaryNavy,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),

            // Sınav Listesi
            BlocBuilder<ExamCubit, ExamState>(
              builder: (context, examState) {
                if (examState is ExamLoading) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 40),
                      child: CircularProgressIndicator(color: AppTheme.primaryBlue),
                    ),
                  );
                }

                if (examState is ExamError) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 40),
                      child: Column(
                        children: [
                          const Icon(Icons.error_outline, color: AppTheme.errorRed, size: 48),
                          const SizedBox(height: 12),
                          Text(
                            examState.message,
                            style: const TextStyle(color: AppTheme.textSecondary),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: () => context.read<ExamCubit>().loadExams(),
                            child: const Text('Yeniden Dene'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                if (examState is ExamLoaded) {
                  final exams = examState.exams;
                  if (exams.isEmpty) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 60),
                        child: Column(
                          children: [
                            Icon(Icons.event_busy_outlined, color: AppTheme.textMuted, size: 54),
                            SizedBox(height: 12),
                            Text(
                              'Atanmış herhangi bir sınavınız bulunmuyor.',
                              style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  return ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: exams.length,
                    separatorBuilder: (_, index) => const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      final exam = exams[index];
                      return _buildExamCard(context, exam);
                    },
                  );
                }

                return const SizedBox.shrink();
              },
            ),
          ],
        ),
      ),
    );
  }

  // Sınav Listesi Kartı Oluşturma
  Widget _buildExamCard(BuildContext context, ExamModel exam) {
    final now = DateTime.now();
    final isUpcoming = now.isBefore(exam.startTime);
    final isActive = exam.isActive;

    Color statusColor;
    Color statusBgColor;
    Color sideIndicatorColor;
    String actionText;
    IconData actionIcon;
    bool enableAction;
    Color actionBtnBg;
    Color actionBtnText;

    if (isActive) {
      statusColor = AppTheme.successGreen;
      statusBgColor = AppTheme.successGreen.withValues(alpha: 0.08);
      sideIndicatorColor = AppTheme.accentGold;
      actionText = 'Sınava Giriş Yap';
      actionIcon = Icons.arrow_forward;
      enableAction = true;
      actionBtnBg = AppTheme.primaryBlue;
      actionBtnText = Colors.white;
    } else if (isUpcoming) {
      statusColor = AppTheme.warningOrange;
      statusBgColor = AppTheme.warningOrange.withValues(alpha: 0.08);
      sideIndicatorColor = AppTheme.warningOrange;
      actionText = 'Sınav Başlamadı';
      actionIcon = Icons.hourglass_empty;
      enableAction = false;
      actionBtnBg = const Color(0xFFE2E8F0);
      actionBtnText = AppTheme.textSecondary;
    } else {
      statusColor = AppTheme.textMuted;
      statusBgColor = const Color(0xFFF1F5F9);
      sideIndicatorColor = AppTheme.textMuted;
      actionText = 'Sınav Tamamlandı';
      actionIcon = Icons.check_circle_outline;
      enableAction = false;
      actionBtnBg = const Color(0xFFE2E8F0);
      actionBtnText = AppTheme.textMuted;
    }

    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isActive ? AppTheme.primaryBlue.withValues(alpha: 0.15) : const Color(0xFFE2E8F0),
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              width: 5,
              color: sideIndicatorColor,
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryBlue.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            exam.branchName,
                            style: const TextStyle(color: AppTheme.primaryBlue, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: statusBgColor,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            exam.statusText,
                            style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      exam.title,
                      style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                    if (exam.description.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        exam.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                      ),
                    ],
                    const Divider(color: Color(0xFFE2E8F0), height: 24),
                    
                    Row(
                      children: [
                        const Icon(Icons.timer_outlined, color: AppTheme.textMuted, size: 14),
                        const SizedBox(width: 6),
                        Text(
                          '${exam.duration} Dakika',
                          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                        ),
                        const SizedBox(width: 16),
                        const Icon(Icons.person_outline, color: AppTheme.textMuted, size: 14),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            exam.teacherName,
                            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.calendar_month_outlined, color: AppTheme.textMuted, size: 14),
                        const SizedBox(width: 6),
                        Text(
                          _formatDateTime(exam.startTime),
                          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    SizedBox(
                      width: double.infinity,
                      height: 40,
                      child: ElevatedButton(
                        onPressed: enableAction
                            ? () {
                                Navigator.of(context).push(
                                  MaterialPageRoute<void>(
                                    builder: (_) => PreflightPage(exam: exam),
                                  ),
                                );
                              }
                            : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: actionBtnBg,
                          foregroundColor: actionBtnText,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          side: BorderSide.none,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              actionText,
                              style: TextStyle(
                                color: actionBtnText,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Icon(
                              actionIcon,
                              color: actionBtnText,
                              size: 14,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 2. SONUÇLAR SEKMESİ (WEB UYUMU)
  Widget _buildResultsTab() {
    if (_isLoadingResults) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primaryBlue));
    }

    if (_resultsError.isNotEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: AppTheme.errorRed, size: 48),
              const SizedBox(height: 12),
              Text(_resultsError, style: const TextStyle(color: AppTheme.textSecondary), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _fetchResults,
                child: const Text('Yeniden Dene'),
              ),
            ],
          ),
        ),
      );
    }

    // Sadece tamamlanmış sınavları filtrele
    final completedSessions = _results.where((s) => s['status'] == 'COMPLETED').toList();

    if (completedSessions.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.assignment_turned_in_outlined, color: AppTheme.textMuted, size: 54),
              SizedBox(height: 12),
              Text(
                'Tamamlanmış herhangi bir sınavınız bulunmuyor.',
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
              ),
            ],
          ),
        ),
      );
    }

    // Ortalama Başarı Hesaplama
    double totalSuccess = 0.0;
    for (var s in completedSessions) {
      final answers = s['answers'] as List<dynamic>? ?? [];
      final gradable = answers.where((a) => a['question']?['type'] == 'MULTIPLE_CHOICE').toList();
      if (gradable.isEmpty) {
        totalSuccess += 100.0;
      } else {
        final correct = gradable.where((a) => a['option']?['isCorrect'] == true).length;
        totalSuccess += (correct / gradable.length) * 100.0;
      }
    }
    final avgSuccess = completedSessions.isEmpty ? 0 : (totalSuccess / completedSessions.length).round();

    return RefreshIndicator(
      onRefresh: _fetchResults,
      color: AppTheme.primaryBlue,
      backgroundColor: Colors.white,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Başarı Özet Kartı
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTheme.primaryNavy, AppTheme.primaryBlue],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryNavy.withValues(alpha: 0.15),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Sınav Başarı İndeksi', style: TextStyle(color: Colors.white70, fontSize: 11)),
                      const SizedBox(height: 4),
                      const Text(
                        'Tamamlanan Sınavlar',
                        style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Text('${completedSessions.length}', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                      const Text('Sınav', style: TextStyle(color: Colors.white70, fontSize: 8, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppTheme.accentGold.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.25)),
                  ),
                  child: Column(
                    children: [
                      Text('%$avgSuccess', style: const TextStyle(color: AppTheme.accentGold, fontSize: 16, fontWeight: FontWeight.bold)),
                      const Text('Ort. Başarı', style: TextStyle(color: AppTheme.accentGold, fontSize: 8, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          const Text(
            'Bitirilen Sınav Detayları',
            style: TextStyle(color: AppTheme.primaryNavy, fontSize: 14, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),

          // Sonuç Kartları
          ...completedSessions.map((session) {
            final exam = session['exam'] as Map<String, dynamic>?;
            final examTitle = exam?['title'] as String? ?? 'Sınav';
            final branchName = exam?['branch']?['name'] as String? ?? 'Şube';
            final answers = session['answers'] as List<dynamic>? ?? [];
            final gradable = answers.where((a) => a['question']?['type'] == 'MULTIPLE_CHOICE').toList();
            
            final correct = gradable.where((a) => a['option']?['isCorrect'] == true).length;
            final total = gradable.length;
            final percent = total == 0 ? 100 : ((correct / total) * 100).round();
            final riskScore = (session['riskScore'] as num? ?? 0).toDouble();

            // Risk badge rengi
            Color riskColor = AppTheme.successGreen;
            String riskLabel = 'Düşük Risk';
            if (riskScore >= 70) {
              riskColor = AppTheme.errorRed;
              riskLabel = 'Yüksek Risk';
            } else if (riskScore >= 40) {
              riskColor = AppTheme.warningOrange;
              riskLabel = 'Orta Risk';
            }

            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 5, offset: const Offset(0, 2)),
                ],
              ),
              child: ListTile(
                contentPadding: const EdgeInsets.all(16),
                title: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      branchName,
                      style: const TextStyle(color: AppTheme.primaryBlue, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      examTitle,
                      style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                subtitle: Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Bitirme: ${_formatIsoString(session['endTime'])}',
                        style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: riskColor.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              riskLabel,
                              style: TextStyle(color: riskColor, fontSize: 9, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '$correct / $total Doğru',
                            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                trailing: Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppTheme.primaryBlue, width: 2),
                  ),
                  child: Center(
                    child: Text(
                      '%$percent',
                      style: const TextStyle(color: AppTheme.primaryBlue, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                onTap: () => _showResultDetails(context, session),
              ),
            );
          }),
        ],
      ),
    );
  }

  // Sınav Sonuç Detayı BottomSheet
  void _showResultDetails(BuildContext context, dynamic session) {
    final exam = session['exam'] as Map<String, dynamic>?;
    final examTitle = exam?['title'] as String? ?? 'Sınav Sonucu';
    final answers = session['answers'] as List<dynamic>? ?? [];

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.all(20),
          height: MediaQuery.of(context).size.height * 0.8,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      examTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: AppTheme.primaryNavy, fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: AppTheme.textSecondary),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
              const Divider(),
              Expanded(
                child: answers.isEmpty
                    ? const Center(
                        child: Text(
                          'Cevap kaydı bulunmuyor.',
                          style: TextStyle(color: AppTheme.textSecondary),
                        ),
                      )
                    : ListView.builder(
                        itemCount: answers.length,
                        itemBuilder: (c, idx) {
                          final ans = answers[idx];
                          final q = ans['question'] as Map<String, dynamic>?;
                          final qText = q?['text'] as String? ?? '';
                          final opt = ans['option'] as Map<String, dynamic>?;
                          final selectedText = opt?['text'] as String? ?? ans['textAnswer'] as String? ?? '-';
                          final isCorrect = opt?['isCorrect'] as bool? ?? false;
                          final isMc = q?['type'] == 'MULTIPLE_CHOICE';

                          return Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Soru ${idx + 1}',
                                  style: const TextStyle(color: AppTheme.primaryBlue, fontSize: 11, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  qText,
                                  style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
                                ),
                                const Divider(height: 16),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Cevabınız: ', style: TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
                                    Expanded(
                                      child: Text(
                                        selectedText,
                                        style: TextStyle(
                                          color: isMc
                                              ? (isCorrect ? AppTheme.successGreen : AppTheme.errorRed)
                                              : AppTheme.textPrimary,
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    if (isMc) ...[
                                      const SizedBox(width: 8),
                                      Icon(
                                        isCorrect ? Icons.check_circle : Icons.cancel,
                                        color: isCorrect ? AppTheme.successGreen : AppTheme.errorRed,
                                        size: 16,
                                      ),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  // 3. PROFİL SEKMESİ (WEB UYUMU)
  Widget _buildProfileTab(AuthState authState, String studentName) {
    if (authState is! AuthAuthenticated) {
      return const Center(child: Text('Profil bilgileri alınamadı.', style: TextStyle(color: AppTheme.textSecondary)));
    }

    final user = authState.user;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Profil Üst Bilgi Kartı
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4)),
              ],
            ),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: AppTheme.primaryBlue.withValues(alpha: 0.08),
                  child: Text(
                    _getInitials(studentName),
                    style: const TextStyle(color: AppTheme.primaryBlue, fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  studentName,
                  style: const TextStyle(color: AppTheme.primaryNavy, fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.accentGold.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    user.role.toUpperCase(),
                    style: const TextStyle(color: AppTheme.primaryNavy, fontSize: 9, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Detaylı Bilgi Listesi
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                _buildProfileItem(Icons.alternate_email, 'Kullanıcı Adı', user.username),
                const Divider(height: 1),
                _buildProfileItem(Icons.email_outlined, 'E-Posta Adresi', user.email),
                const Divider(height: 1),
                _buildProfileItem(Icons.badge_outlined, 'Kimlik Doğrulama Durumu', 'Doğrulanmış Hesap'),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Çıkış Yap Butonu
          SizedBox(
            width: double.infinity,
            height: 44,
            child: OutlinedButton(
              onPressed: _showLogoutDialog,
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppTheme.errorRed),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.logout, color: AppTheme.errorRed, size: 18),
                  SizedBox(width: 8),
                  Text('Oturumu Kapat', style: TextStyle(color: AppTheme.errorRed, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileItem(IconData icon, String title, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.primaryBlue, size: 20),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 10)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Ortak Çıkış Yap Diyaloğu
  void _showLogoutDialog() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        title: const Text('Çıkış Yap', style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.bold)),
        content: const Text('Hesabınızdan çıkış yapmak istediğinize emin misiniz?', style: TextStyle(color: AppTheme.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Vazgeç', style: TextStyle(color: AppTheme.textSecondary)),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              context.read<AuthCubit>().logout();
            },
            child: const Text('Çıkış Yap', style: TextStyle(color: AppTheme.errorRed, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
