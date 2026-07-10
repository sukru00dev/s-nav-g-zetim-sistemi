import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/device_utils.dart';
import '../cubit/auth_cubit.dart';
import '../cubit/auth_state.dart';
import 'verify_email_page.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  
  final _forenameController = TextEditingController();
  final _surnameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _tcController = TextEditingController();
  final _emailController = TextEditingController();
  final _yearController = TextEditingController();
  final _passwordController = TextEditingController();
  
  bool _obscurePassword = true;

  @override
  void dispose() {
    _forenameController.dispose();
    _surnameController.dispose();
    _usernameController.dispose();
    _tcController.dispose();
    _emailController.dispose();
    _yearController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submitRegister() async {
    if (_formKey.currentState!.validate()) {
      final deviceId = await DeviceUtils.getDeviceId();
      if (mounted) {
        context.read<AuthCubit>().register(
              username: _usernameController.text.trim(),
              email: _emailController.text.trim(),
              password: _passwordController.text,
              forename: _forenameController.text.trim(),
              surname: _surnameController.text.trim(),
              tcKimlik: _tcController.text.trim(),
              yearOfBirth: int.parse(_yearController.text.trim()),
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
          if (state is AuthRegisterSuccess) {
            // Kayıt başarılıysa Snackback göster ve OTP doğrulamasına yönlendir
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppTheme.successGreen,
                duration: const Duration(seconds: 4),
              ),
            );
            Navigator.of(context).pushReplacement(
              MaterialPageRoute<void>(
                builder: (_) => VerifyEmailPage(email: state.email),
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
              // Arka plan gradyanı
              Positioned.fill(
                child: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppTheme.bgDark,
                        Color(0xFF0F172A),
                        AppTheme.primaryNavy,
                      ],
                      stops: [0.3, 0.7, 1.0],
                    ),
                  ),
                ),
              ),

              SafeArea(
                child: Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Başlık
                        Text(
                          'ÖĞRENCİ HESABI OLUŞTUR',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                color: Colors.white,
                                letterSpacing: 1.2,
                              ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Bilgilerinizi eksiksiz ve doğru giriniz.',
                          style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                        ),
                        const SizedBox(height: 24),

                        // Form Kartı
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceDark.withValues(alpha: 0.85),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: const Color(0xFF334155), width: 0.8),
                          ),
                          child: Form(
                            key: _formKey,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                // Ad & Soyad (Yan yana)
                                Row(
                                  children: [
                                    Expanded(
                                      child: TextFormField(
                                        controller: _forenameController,
                                        style: const TextStyle(color: Colors.white, fontSize: 13),
                                        decoration: const InputDecoration(
                                          labelText: 'Adınız',
                                          prefixIcon: Icon(Icons.person_outline, size: 18),
                                        ),
                                        validator: (value) => value == null || value.trim().isEmpty ? 'Ad gereklidir' : null,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: TextFormField(
                                        controller: _surnameController,
                                        style: const TextStyle(color: Colors.white, fontSize: 13),
                                        decoration: const InputDecoration(
                                          labelText: 'Soyadınız',
                                        ),
                                        validator: (value) => value == null || value.trim().isEmpty ? 'Soyad gereklidir' : null,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),

                                // Kullanıcı Adı
                                TextFormField(
                                  controller: _usernameController,
                                  style: const TextStyle(color: Colors.white, fontSize: 13),
                                  decoration: const InputDecoration(
                                    labelText: 'Kullanıcı Adı',
                                    prefixIcon: Icon(Icons.alternate_email, size: 18),
                                  ),
                                  validator: (value) => value == null || value.trim().isEmpty ? 'Kullanıcı adı gereklidir' : null,
                                ),
                                const SizedBox(height: 16),

                                // T.C. Kimlik
                                TextFormField(
                                  controller: _tcController,
                                  keyboardType: TextInputType.number,
                                  maxLength: 11,
                                  style: const TextStyle(color: Colors.white, fontSize: 13),
                                  decoration: const InputDecoration(
                                    labelText: 'T.C. Kimlik No',
                                    prefixIcon: Icon(Icons.badge_outlined, size: 18),
                                    counterText: '',
                                  ),
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'T.C. Kimlik numarası gereklidir';
                                    }
                                    if (value.trim().length != 11) {
                                      return '11 hane olmalıdır';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),

                                // Doğum Yılı & E-Posta (Yan Yana)
                                Row(
                                  children: [
                                    SizedBox(
                                      width: 100,
                                      child: TextFormField(
                                        controller: _yearController,
                                        keyboardType: TextInputType.number,
                                        maxLength: 4,
                                        style: const TextStyle(color: Colors.white, fontSize: 13),
                                        decoration: const InputDecoration(
                                          labelText: 'Doğum Yılı',
                                          counterText: '',
                                        ),
                                        validator: (value) {
                                          if (value == null || value.trim().isEmpty) {
                                            return 'Gerekli';
                                          }
                                          if (int.tryParse(value) == null) {
                                            return 'Geçersiz';
                                          }
                                          return null;
                                        },
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: TextFormField(
                                        controller: _emailController,
                                        keyboardType: TextInputType.emailAddress,
                                        style: const TextStyle(color: Colors.white, fontSize: 13),
                                        decoration: const InputDecoration(
                                          labelText: 'E-Posta Adresi',
                                          prefixIcon: Icon(Icons.mail_outline, size: 18),
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
                                const SizedBox(height: 16),

                                // Şifre
                                TextFormField(
                                  controller: _passwordController,
                                  obscureText: _obscurePassword,
                                  style: const TextStyle(color: Colors.white, fontSize: 13),
                                  decoration: InputDecoration(
                                    labelText: 'Şifre',
                                    prefixIcon: const Icon(Icons.lock_outline, size: 18),
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        _obscurePassword ? Icons.visibility : Icons.visibility_off,
                                        color: AppTheme.textSecondary,
                                        size: 18,
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
                                      return 'Şifre gereklidir';
                                    }
                                    if (value.length < 6) {
                                      return 'En az 6 karakter olmalıdır';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 24),

                                // Kayıt Butonu
                                ElevatedButton(
                                  onPressed: isLoading ? null : _submitRegister,
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
                                            Text('Kayıt Ol'),
                                            SizedBox(width: 8),
                                            Icon(Icons.person_add, size: 18),
                                          ],
                                        ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Giriş Ekranına Dön
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text(
                              'Zaten bir hesabınız var mı?',
                              style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                            ),
                            TextButton(
                              onPressed: () {
                                Navigator.of(context).pop();
                              },
                              child: const Text(
                                'Giriş Yapın',
                                style: TextStyle(
                                  color: AppTheme.accentGold,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ],
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
