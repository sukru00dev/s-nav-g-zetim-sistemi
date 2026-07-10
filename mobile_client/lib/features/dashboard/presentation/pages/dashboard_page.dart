import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
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
  @override
  void initState() {
    super.initState();
    // Sayfa açıldığında sınavları yükle
    context.read<ExamCubit>().loadExams();
  }

  String _formatDateTime(DateTime dt) {
    return DateFormat('dd MMMM yyyy, HH:mm', 'tr_TR').format(dt);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
            const Text('Öğrenci Sınav Paneli'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppTheme.textPrimary),
            onPressed: () => context.read<ExamCubit>().loadExams(),
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: AppTheme.errorRed),
            onPressed: () {
              // Çıkış yaparken onay sor
              showDialog<void>(
                context: context,
                builder: (ctx) => AlertDialog(
                  backgroundColor: AppTheme.surfaceDark,
                  title: const Text('Çıkış Yap'),
                  content: const Text('Hesabınızdan çıkış yapmak istediğinize emin misiniz?'),
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
            },
          ),
        ],
      ),
      body: BlocBuilder<AuthCubit, AuthState>(
        builder: (context, authState) {
          String studentName = 'Öğrenci';
          if (authState is AuthAuthenticated) {
            studentName = '${authState.user.forename} ${authState.user.surname}';
          }

          return RefreshIndicator(
            onRefresh: () => context.read<ExamCubit>().loadExams(),
            color: AppTheme.accentGold,
            backgroundColor: AppTheme.surfaceDark,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Hoş Geldiniz Kartı
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.primaryNavy, Color(0xFF0F172A)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.indigo.withValues(alpha: 0.3), width: 1),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Hoş Geldiniz,',
                          style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          studentName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Row(
                          children: [
                            Icon(Icons.shield_outlined, color: AppTheme.accentGold, size: 14),
                            SizedBox(width: 6),
                            Text(
                              'Mobil Gözetim Modu Aktif',
                              style: TextStyle(color: AppTheme.accentGold, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ],
                        )
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  const Text(
                    'Sınavlarınız',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
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
                            child: CircularProgressIndicator(color: AppTheme.accentGold),
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
        },
      ),
    );
  }

  Widget _buildExamCard(BuildContext context, ExamModel exam) {
    final now = DateTime.now();
    final isUpcoming = now.isBefore(exam.startTime);
    final isActive = exam.isActive;

    Color statusColor;
    String actionText;
    IconData actionIcon;
    bool enableAction;

    if (isActive) {
      statusColor = AppTheme.successGreen;
      actionText = 'Sınava Giriş Yap';
      actionIcon = Icons.arrow_forward;
      enableAction = true;
    } else if (isUpcoming) {
      statusColor = AppTheme.warningOrange;
      actionText = 'Sınav Başlamadı';
      actionIcon = Icons.hourglass_empty;
      enableAction = false;
    } else {
      statusColor = AppTheme.textMuted;
      actionText = 'Sınav Tamamlandı';
      actionIcon = Icons.check_circle_outline;
      enableAction = false;
    }

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surfaceDark,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isActive ? AppTheme.accentGold.withValues(alpha: 0.3) : const Color(0xFF334155),
          width: isActive ? 1.5 : 0.8,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Sınav Bilgileri
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Şube / Birim ismi
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryNavy.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Colors.indigo.withValues(alpha: 0.2)),
                      ),
                      child: Text(
                        exam.branchName,
                        style: const TextStyle(color: AppTheme.accentGold, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                    // Sınav Durum Etiketi
                    Row(
                      children: [
                        if (isActive)
                          Container(
                            width: 8,
                            height: 8,
                            margin: const EdgeInsets.only(right: 6),
                            decoration: const BoxDecoration(
                              color: AppTheme.successGreen,
                              shape: BoxShape.circle,
                            ),
                          ),
                        Text(
                          exam.statusText,
                          style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  exam.title,
                  style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                ),
                if (exam.description.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    exam.description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                  ),
                ],
                const Divider(color: Color(0xFF334155), height: 24),
                
                // Detay Grid (Süre, Hoca, Tarih)
                Row(
                  children: [
                    const Icon(Icons.timer, color: AppTheme.textMuted, size: 14),
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
              ],
            ),
          ),

          // Sınava Başlama Butonu
          InkWell(
            onTap: enableAction
                ? () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => PreflightPage(exam: exam),
                      ),
                    );
                  }
                : null,
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(16),
              bottomRight: Radius.circular(16),
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: isActive
                    ? AppTheme.accentGold
                    : const Color(0xFF1E293B).withValues(alpha: 0.6),
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(15),
                  bottomRight: Radius.circular(15),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    actionText,
                    style: TextStyle(
                      color: isActive ? AppTheme.primaryNavy : AppTheme.textMuted,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Icon(
                    actionIcon,
                    color: isActive ? AppTheme.primaryNavy : AppTheme.textMuted,
                    size: 16,
                  ),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
