import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_theme.dart';
import '../cubit/auth_cubit.dart';
import '../cubit/auth_state.dart';

class VerifyEmailPage extends StatefulWidget {
  final String email;

  const VerifyEmailPage({super.key, required this.email});

  @override
  State<VerifyEmailPage> createState() => _VerifyEmailPageState();
}

class _VerifyEmailPageState extends State<VerifyEmailPage> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  void _onOtpChanged(int index, String value) {
    if (value.isNotEmpty) {
      // Sadece 1 hane al
      if (value.length > 1) {
        _controllers[index].text = value.substring(value.length - 1);
      }
      
      // Bir sonraki kutuya odaklan
      if (index < 5) {
        _focusNodes[index + 1].requestFocus();
      } else {
        // Son rakam da girildiyse klavyeyi kapat
        _focusNodes[index].unfocus();
      }
    }
    setState(() {});
  }

  void _onOtpKeyDown(int index, KeyEvent event) {
    // Backspace tuşuna basıldığında ve kutu boşken bir öncekine dön
    if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.backspace) {
      if (_controllers[index].text.isEmpty && index > 0) {
        _controllers[index - 1].clear();
        _focusNodes[index - 1].requestFocus();
      } else {
        _controllers[index].clear();
      }
      setState(() {});
    }
  }

  String _getOtpCode() {
    return _controllers.map((c) => c.text).join();
  }

  void _submitCode() {
    final code = _getOtpCode();
    if (code.length == 6) {
      context.read<AuthCubit>().verifyCode(email: widget.email, code: code);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isCodeComplete = _getOtpCode().length == 6;

    return Scaffold(
      body: BlocConsumer<AuthCubit, AuthState>(
        listener: (context, state) {
          if (state is AuthRegisterSuccess && state.message.contains('şifrenizle')) {
            // Başarılı doğrulama
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppTheme.successGreen,
                duration: const Duration(seconds: 4),
              ),
            );
            context.read<AuthCubit>().resetToLogin();
            Navigator.of(context).popUntil((route) => route.isFirst);
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
              // Arka Plan
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
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Mail Kilidi Logosu
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceDark,
                            shape: BoxShape.circle,
                            border: Border.all(color: AppTheme.accentGold, width: 2),
                          ),
                          child: const Icon(
                            Icons.mail_lock_outlined,
                            size: 40,
                            color: AppTheme.accentGold,
                          ),
                        ),
                        const SizedBox(height: 24),

                        Text(
                          'E-POSTA DOĞRULAMA',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                color: Colors.white,
                                letterSpacing: 1.2,
                              ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Lütfen e-posta adresinize gönderilen 6 haneli doğrulama kodunu giriniz.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          widget.email,
                          style: const TextStyle(
                            color: AppTheme.accentGold,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 32),

                        // OTP KART
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceDark.withValues(alpha: 0.85),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: const Color(0xFF334155), width: 0.8),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // OTP Inputs
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: List.generate(6, (index) {
                                  return SizedBox(
                                    width: 44,
                                    height: 56,
                                    child: KeyboardListener(
                                      focusNode: FocusNode(canRequestFocus: false),
                                      onKeyEvent: (event) => _onOtpKeyDown(index, event),
                                      child: TextField(
                                        controller: _controllers[index],
                                        focusNode: _focusNodes[index],
                                        keyboardType: TextInputType.number,
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold,
                                        ),
                                        inputFormatters: [
                                          FilteringTextInputFormatter.digitsOnly,
                                        ],
                                        decoration: InputDecoration(
                                          contentPadding: EdgeInsets.zero,
                                          border: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(10),
                                            borderSide: const BorderSide(color: Color(0xFF475569)),
                                          ),
                                        ),
                                        onChanged: (val) => _onOtpChanged(index, val),
                                      ),
                                    ),
                                  );
                                }),
                              ),
                              const SizedBox(height: 32),

                              // Onayla Butonu
                              ElevatedButton(
                                onPressed: (isLoading || !isCodeComplete) ? null : _submitCode,
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
                                          Text('Hesabı Doğrula'),
                                          SizedBox(width: 8),
                                          Icon(Icons.verified, size: 18),
                                        ],
                                      ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Geri Dön
                        TextButton(
                          onPressed: () {
                            context.read<AuthCubit>().resetToLogin();
                            Navigator.of(context).pop();
                          },
                          child: const Text(
                            'Giriş Ekranına Geri Dön',
                            style: TextStyle(
                              color: AppTheme.textSecondary,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              decoration: TextDecoration.underline,
                            ),
                          ),
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
