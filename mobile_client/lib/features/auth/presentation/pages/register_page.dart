import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
      backgroundColor: AppTheme.bgLight,
      body: BlocConsumer<AuthCubit, AuthState>(
        listener: (context, state) {
          if (state is AuthRegisterSuccess) {
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

          return SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Geri Dön butonu ve Başlık
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_back, color: AppTheme.primaryNavy),
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                        const Expanded(
                          child: Text(
                            'KAYIT OL',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryNavy,
                              letterSpacing: 1.0,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    const Padding(
                      padding: EdgeInsets.only(left: 48),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'Lütfen MERNİS bilgilerinizle uyumlu şekilde kayıt olun.',
                          style: TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Form Kartı (Stitch Tasarım Uyumu)
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.0),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 15,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Ad & Soyad
                            Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: _forenameController,
                                    style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                                    decoration: const InputDecoration(
                                      labelText: 'Adınız',
                                      prefixIcon: Icon(Icons.person_outline, size: 20, color: AppTheme.textSecondary),
                                    ),
                                    validator: (value) => value == null || value.trim().isEmpty ? 'Ad gereklidir' : null,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextFormField(
                                    controller: _surnameController,
                                    style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                                    decoration: const InputDecoration(
                                      labelText: 'Soyadınız',
                                    ),
                                    validator: (value) => value == null || value.trim().isEmpty ? 'Soyad gereklidir' : null,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),

                            // Kullanıcı Adı
                            TextFormField(
                              controller: _usernameController,
                              style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                              decoration: const InputDecoration(
                                labelText: 'Kullanıcı Adı',
                                prefixIcon: Icon(Icons.alternate_email, size: 20, color: AppTheme.textSecondary),
                              ),
                              validator: (value) => value == null || value.trim().isEmpty ? 'Kullanıcı adı gereklidir' : null,
                            ),
                            const SizedBox(height: 14),

                            // T.C. Kimlik
                            TextFormField(
                              controller: _tcController,
                              keyboardType: TextInputType.number,
                              maxLength: 11,
                              style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                              ],
                              decoration: const InputDecoration(
                                labelText: 'T.C. Kimlik Numarası',
                                prefixIcon: Icon(Icons.badge_outlined, size: 20, color: AppTheme.textSecondary),
                                counterText: '',
                              ),
                              validator: (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return 'T.C. Kimlik numarası gereklidir';
                                }
                                if (value.trim().length != 11) {
                                  return '11 haneli olmalıdır';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 14),

                            // Doğum Yılı & E-Posta
                            Row(
                              children: [
                                SizedBox(
                                  width: 90,
                                  child: TextFormField(
                                    controller: _yearController,
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
                                    controller: _emailController,
                                    keyboardType: TextInputType.emailAddress,
                                    style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                                    decoration: const InputDecoration(
                                      labelText: 'E-Posta Adresi',
                                      prefixIcon: Icon(Icons.mail_outline, size: 20, color: AppTheme.textSecondary),
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
                            const SizedBox(height: 14),

                            // Şifre
                            TextFormField(
                              controller: _passwordController,
                              obscureText: _obscurePassword,
                              style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
                              decoration: InputDecoration(
                                labelText: 'Şifre',
                                prefixIcon: const Icon(Icons.lock_outline, size: 20, color: AppTheme.textSecondary),
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
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text('Kayıt Ol'),
                                        SizedBox(width: 6),
                                        Icon(Icons.person_add, size: 16),
                                      ],
                                    ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Giriş Yap Yönlendirmesi
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
                              color: AppTheme.primaryBlue,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ),
                      ],
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
}
