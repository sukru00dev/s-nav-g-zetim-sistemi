import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'core/database/local_db_manager.dart';
import 'core/network/dio_client.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/data/repositories/auth_repository.dart';
import 'features/auth/presentation/cubit/auth_cubit.dart';
import 'features/auth/presentation/cubit/auth_state.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/dashboard/presentation/pages/dashboard_page.dart';
import 'features/exam/data/repositories/exam_repository.dart';
import 'features/exam/presentation/cubit/exam_cubit.dart';

import 'package:intl/date_symbol_data_local.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Yerel veri tabanı (SharedPreferences) başlangıç kurulumu
  await LocalDbManager.init();

  // Türkçe tarih formatlama desteğini başlat
  await initializeDateFormatting('tr_TR', null);

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Bağımlılıkların enjeksiyonu
    final dioClient = DioClient();
    final authRepository = AuthRepository(dioClient);
    final examRepository = ExamRepository(dioClient);

    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider<DioClient>.value(value: dioClient),
        RepositoryProvider<AuthRepository>.value(value: authRepository),
        RepositoryProvider<ExamRepository>.value(value: examRepository),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider<AuthCubit>(
            create: (context) => AuthCubit(authRepository)..appStarted(),
          ),
          BlocProvider<ExamCubit>(
            create: (context) => ExamCubit(examRepository),
          ),
        ],
        child: MaterialApp(
          title: 'LEUKOLION',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          initialRoute: '/',
          routes: {
            '/': (context) => const AuthGate(),
            '/login': (context) => const LoginPage(),
            '/dashboard': (context) => const DashboardPage(),
          },
        ),
      ),
    );
  }
}

// Oturum Durumuna Göre Yönlendirme Yapan Geçiş Kapısı
class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthCubit, AuthState>(
      builder: (context, state) {
        if (state is AuthAuthenticated) {
          return const DashboardPage();
        } else if (state is AuthInitial || state is AuthLoading) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(color: AppTheme.accentGold),
            ),
          );
        } else {
          return const LoginPage();
        }
      },
    );
  }
}
