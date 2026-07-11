import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
  final _forgotFormKey = GlobalKey<FormState>();
  
  // Login Controllers
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  // Forgot Password State & Controllers
  bool _isForgotPassword = false;
  final _forgotTcController = TextEditingController();
  final _forgotForenameController = TextEditingController();
  final _forgotSurnameController = TextEditingController();
  final _forgotYearController = TextEditingController();
  final _forgotEmailController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _forgotTcController.dispose();
    _forgotForenameController.dispose();
    _forgotSurnameController.dispose();
    _forgotYearController.dispose();
    _forgotEmailController.dispose();
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

  Future<void> _submitForgotPassword() async {
    if (_forgotFormKey.currentState!.validate()) {
      context.read<AuthCubit>().forgotPassword(
            tcKimlik: _forgotTcController.text.trim(),
            forename: _forgotForenameController.text.trim(),
            surname: _forgotSurnameController.text.trim(),
            yearOfBirth: _forgotYearController.text.trim(),
            email: _forgotEmailController.text.trim(),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      body: BlocConsumer<AuthCubit, AuthState>(
        listener: (context, state) {
          if (state is AuthAuthenticated) {
            Navigator.of(context).pushReplacementNamed('/dashboard');
          } else if (state is AuthUnverified) {
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
            // Şifre sıfırlama veya Kayıt Başarılı SnackBar'ı
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppTheme.successGreen,
                duration: const Duration(seconds: 5),
              ),
            );
            if (_isForgotPassword) {
              setState(() {
                _isForgotPassword = false;
                // Formları temizle
                _forgotTcController.clear();
                _forgotForenameController.clear();
                _forgotSurnameController.clear();
                _forgotYearController.clear();
                _forgotEmailController.clear();
              });
              context.read<AuthCubit>().resetToLogin();
            }
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

          return SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 16),
                    // Giriş Kartı (Stitch Arayüz Tasarımı Entegrasyonu)
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: const Color(0xFFE2E8F0),
                          width: 1.0,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.06),
                            blurRadius: 20,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          // Branding Üst Bölüm (Lacivert Banner)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                            decoration: const BoxDecoration(
                              color: AppTheme.primaryNavy,
                              borderRadius: BorderRadius.only(
                                topLeft: Radius.circular(16),
                                topRight: Radius.circular(16),
                              ),
                            ),
                            child: Column(
                              children: [
                                Container(
                                  width: 70,
                                  height: 70,
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Image.asset(
                                    'assets/images/logo.png',
                                    fit: BoxFit.contain,
                                    errorBuilder: (context, error, stackTrace) => const Icon(
                                      Icons.school,
                                      size: 36,
                                      color: AppTheme.primaryNavy,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                const Text(
                                  'HARRAN ÜNİVERSİTESİ',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Sınav Yönetim ve Gözetim Sistemi',
                                  style: TextStyle(
                                    color: AppTheme.lightGold,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Form İçerik Alanı
                          Padding(
                            padding: const EdgeInsets.all(24),
                            child: _isForgotPassword
                                ? _buildForgotPasswordForm(isLoading)
                                : _buildLoginForm(isLoading),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Kayıt Ol Yönlendirmesi (Eğer şifre sıfırlamada değilse)
                    if (!_isForgotPassword)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'Yeni hesap oluşturmak için: ',
                            style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                          ),
                          TextButton(
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute<void>(
                                  builder: (_) => const RegisterPage(),
                                ),
                              );
                            },
                            child: const Text(
                              'Kayıt Ol',
                              style: TextStyle(
                                color: AppTheme.primaryBlue,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                decoration: TextDecoration.underline,
                              ),
                            ),
                          ),
                        ],
                      ),

                    const SizedBox(height: 12),
                    // Alt Bilgi Linkleri
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('KULLANIM KOŞULLARI', style: TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.bold)),
                        SizedBox(width: 10),
                        Icon(Icons.circle, size: 4, color: AppTheme.textMuted),
                        SizedBox(width: 10),
                        Text('KVKK AYDINLATMA METNİ', style: TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      '© 2026 Harran Üniversitesi · Tüm Hakları Saklıdır',
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 10),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // Giriş Yap Formu
  Widget _buildLoginForm(bool isLoading) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Öğrenci Girişi',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryBlue,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          const Text(
            'Lütfen akademik bilgilerinizi kullanarak oturum açın.',
            style: TextStyle(color: AppTheme.textSecondary, fontSize: 11),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),

          // T.C. Kimlik / E-Posta
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
            decoration: const InputDecoration(
              labelText: 'T.C. Kimlik Numarası / E-Posta',
              prefixIcon: Icon(Icons.badge_outlined, color: AppTheme.textSecondary, size: 20),
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
            style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
            decoration: InputDecoration(
              labelText: 'Şifre',
              prefixIcon: const Icon(Icons.lock_outline, color: AppTheme.textSecondary, size: 20),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword ? Icons.visibility : Icons.visibility_off,
                  color: AppTheme.textSecondary,
                  size: 20,
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

          // WAF Güvenlik Uyarısı (Stitch Tasarımı)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: AppTheme.primaryBlue.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppTheme.primaryBlue.withValues(alpha: 0.15)),
            ),
            child: const Row(
              children: [
                Icon(Icons.verified_user, color: AppTheme.primaryBlue, size: 18),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Sistem güvenli giriş katmanı (WAF) ile korunmaktadır.',
                    style: TextStyle(
                      color: AppTheme.primaryBlue,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                )
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Giriş Yap Butonu
          ElevatedButton(
            onPressed: isLoading ? null : _submitLogin,
            child: isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.0,
                      color: Colors.white,
                    ),
                  )
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Giriş Yap'),
                      SizedBox(width: 6),
                      Icon(Icons.login, size: 16),
                    ],
                  ),
          ),
          const SizedBox(height: 16),

          // Şifremi Unuttum Linki
          Center(
            child: TextButton.icon(
              onPressed: () {
                setState(() {
                  _isForgotPassword = true;
                });
              },
              icon: const Icon(Icons.help_center_outlined, size: 16, color: AppTheme.primaryBlue),
              label: const Text(
                'Şifremi Unuttum',
                style: TextStyle(
                  color: AppTheme.primaryBlue,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Şifre Sıfırlama Formu (Stitch Tasarımı)
  Widget _buildForgotPasswordForm(bool isLoading) {
    return Form(
      key: _forgotFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back, color: AppTheme.primaryBlue, size: 20),
                onPressed: () {
                  setState(() {
                    _isForgotPassword = false;
                  });
                  context.read<AuthCubit>().resetToLogin();
                },
              ),
              const Expanded(
                child: Text(
                  'Şifre Sıfırlama',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryBlue,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Lütfen aşağıdaki alanları MERNİS bilgilerinizle uyumlu şekilde doldurunuz.',
            style: TextStyle(color: AppTheme.textSecondary, fontSize: 11),
          ),
          const SizedBox(height: 16),

          // T.C. Kimlik No
          TextFormField(
            controller: _forgotTcController,
            keyboardType: TextInputType.number,
            maxLength: 11,
            style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
            ],
            decoration: const InputDecoration(
              labelText: 'T.C. Kimlik Numarası',
              counterText: '',
              prefixIcon: Icon(Icons.badge_outlined, color: AppTheme.textSecondary, size: 20),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'T.C. Kimlik No gereklidir';
              }
              if (value.trim().length != 11) {
                return '11 haneli olmalıdır';
              }
              return null;
            },
          ),
          const SizedBox(height: 12),

          // Ad & Soyad
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _forgotForenameController,
                  style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                  decoration: const InputDecoration(
                    labelText: 'Adınız',
                  ),
                  validator: (value) => value == null || value.trim().isEmpty ? 'Ad gereklidir' : null,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  controller: _forgotSurnameController,
                  style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                  decoration: const InputDecoration(
                    labelText: 'Soyadınız',
                  ),
                  validator: (value) => value == null || value.trim().isEmpty ? 'Soyad gereklidir' : null,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Doğum Yılı & E-Posta
          Row(
            children: [
              SizedBox(
                width: 90,
                child: TextFormField(
                  controller: _forgotYearController,
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                  ],
                  decoration: const InputDecoration(
                    labelText: 'Doğum Yılı',
                    counterText: '',
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Gerekli';
                    }
                    if (value.trim().length != 4) {
                      return 'Geçersiz';
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  controller: _forgotEmailController,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                  decoration: const InputDecoration(
                    labelText: 'E-Posta',
                    prefixIcon: Icon(Icons.mail_outline, color: AppTheme.textSecondary, size: 20),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'E-posta gereklidir';
                    }
                    if (!value.contains('@')) {
                      return 'Geçersiz e-posta';
                    }
                    return null;
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Sıfırlama Bağlantısı Gönder Butonu
          ElevatedButton(
            onPressed: isLoading ? null : _submitForgotPassword,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.accentGold,
              foregroundColor: AppTheme.primaryNavy,
            ),
            child: isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.0,
                      color: AppTheme.primaryNavy,
                    ),
                  )
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Şifremi Sıfırla'),
                      SizedBox(width: 6),
                      Icon(Icons.send, size: 16),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
