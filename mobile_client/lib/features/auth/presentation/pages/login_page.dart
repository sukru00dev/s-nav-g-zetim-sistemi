import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/device_utils.dart';
import '../cubit/auth_cubit.dart';
import '../cubit/auth_state.dart';
import 'register_page.dart';
import 'verify_email_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submitLogin() async {
    if (_formKey.currentState!.validate()) {
      final deviceId = await DeviceUtils.getDeviceId();
      if (mounted) {
        context.read<AuthCubit>().login(
              emailOrTc: _emailController.text.trim(),
              password: _passwordController.text,
              macAddress: deviceId,
            );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocConsumer<AuthCubit, AuthState>(
        listener: (context, state) {
          if (state is AuthAuthenticated) {
            // Başarılı giriş durumunda öğrenci paneline yönlendir
            Navigator.of(context).pushReplacementNamed('/dashboard');
          } else if (state is AuthUnverified) {
            // Doğrulanmamış hesap durumunda OTP sayfasına yönlendir
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppTheme.warningOrange,
              ),
            );
            Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => VerifyEmailPage(email: state.email),
              ),
            );
          } else if (state is AuthRegisterSuccess) {
            // Doğrulama kodu gönderildi bilgisi
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppTheme.successGreen,
              ),
            );
          } else if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppTheme.errorRed,
              ),
            );
          }
        },
        builder: (context, state) {
          final isLoading = state is AuthLoading;

          return Stack(
            children: [
              // Arka plan gradyanı ve küreler
              Positioned.fill(
                child: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppTheme.bgDark,
                        Color(0xFF0F172A), // Slate 900
                        AppTheme.primaryNavy,
                      ],
                      stops: [0.3, 0.7, 1.0],
                    ),
                  ),
                ),
              ),
              // Dekoratif ışık süzmesi
              Positioned(
                top: -100,
                left: -100,
                child: Container(
                  width: 300,
                  height: 300,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.indigo.withValues(alpha: 0.15),
                  ),
                ),
              ),

              // Ana İçerik
              SafeArea(
                child: Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Üniversite Logosu
                        Container(
                          width: 80,
                          height: 80,
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.3),
                                blurRadius: 15,
                                offset: const Offset(0, 5),
                              ),
                            ],
                          ),
                          child: Image.asset(
                            'assets/images/logo.png', // Logo asset
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) => const Icon(
                              Icons.school,
                              size: 40,
                              color: AppTheme.primaryNavy,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'HARRAN ÜNİVERSİTESİ',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                color: Colors.white,
                                letterSpacing: 1.2,
                              ),
                        ),
                        Text(
                          'Sınav Yönetim ve Gözetim Sistemi',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppTheme.textSecondary,
                              ),
                        ),
                        const SizedBox(height: 32),

                        // Login Giriş Kartı
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceDark.withValues(alpha: 0.85),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: const Color(0xFF334155),
                              width: 0.8,
                            ),
                          ),
                          child: Form(
                            key: _formKey,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Text(
                                  'Öğrenci Girişi',
                                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                        fontSize: 20,
                                        color: AppTheme.accentGold,
                                      ),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 24),

                                // TC Kimlik / E-Posta
                                TextFormField(
                                  controller: _emailController,
                                  keyboardType: TextInputType.emailAddress,
                                  style: const TextStyle(color: Colors.white, fontSize: 14),
                                  decoration: const InputDecoration(
                                    labelText: 'T.C. Kimlik / E-Posta',
                                    prefixIcon: Icon(Icons.badge_outlined, color: AppTheme.textSecondary),
                                    hintText: 'TCKN veya e-posta giriniz',
                                  ),
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Bu alan boş geçilemez';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),

                                // Şifre
                                TextFormField(
                                  controller: _passwordController,
                                  obscureText: _obscurePassword,
                                  style: const TextStyle(color: Colors.white, fontSize: 14),
                                  decoration: InputDecoration(
                                    labelText: 'Şifre',
                                    prefixIcon: const Icon(Icons.lock_outline, color: AppTheme.textSecondary),
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        _obscurePassword ? Icons.visibility : Icons.visibility_off,
                                        color: AppTheme.textSecondary,
                                      ),
                                      onPressed: () {
                                        setState(() {
                                          _obscurePassword = !_obscurePassword;
                                        });
                                      },
                                    ),
                                  ),
                                  validator: (value) {
                                    if (value == null || value.isEmpty) {
                                      return 'Lütfen şifrenizi giriniz';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),

                                // Güvenlik Uyarısı
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryNavy.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: Colors.indigo.withValues(alpha: 0.2)),
                                  ),
                                  child: const Row(
                                    children: [
                                      Icon(Icons.security, color: AppTheme.accentGold, size: 18),
                                      SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          'Sistem güvenli giriş katmanı (WAF) ile korunmaktadır.',
                                          style: TextStyle(color: AppTheme.textSecondary, fontSize: 9, fontWeight: FontWeight.bold),
                                        ),
                                      )
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 24),

                                // Giriş Yap Butonu
                                ElevatedButton(
                                  onPressed: isLoading ? null : _submitLogin,
                                  child: isLoading
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: AppTheme.primaryNavy,
                                          ),
                                        )
                                      : const Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Text('Giriş Yap'),
                                            SizedBox(width: 8),
                                            Icon(Icons.login, size: 18),
                                          ],
                                        ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Kayıt Ol Yönlendirmesi
                        TextButton(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => const RegisterPage(),
                              ),
                            );
                          },
                          child: const Text(
                            'Yeni Hesap Oluştur / Kayıt Ol',
                            style: TextStyle(
                              color: AppTheme.accentGold,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          '© 2026 Harran Üniversitesi · LEUKOLION v2.0',
                          style: TextStyle(color: AppTheme.textMuted, fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
