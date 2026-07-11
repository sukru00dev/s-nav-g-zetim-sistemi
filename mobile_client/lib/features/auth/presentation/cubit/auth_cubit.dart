import 'package:flutter_bloc/flutter_bloc.dart';
import '../../data/repositories/auth_repository.dart';
import 'auth_state.dart';

class AuthCubit extends Cubit<AuthState> {
  final AuthRepository _repository;

  AuthCubit(this._repository) : super(AuthInitial());

  // Uygulama Başlatıldığında (Oturum durumunu kontrol et)
  Future<void> appStarted() async {
    try {
      final user = await _repository.getAuthenticatedUser();
      final hasToken = await _repository.hasToken();
      if (hasToken && user != null) {
        emit(AuthAuthenticated(user));
      } else {
        emit(AuthUnauthenticated());
      }
    } catch (_) {
      emit(AuthUnauthenticated());
    }
  }

  // Giriş Yap (Login)
  Future<void> login({
    required String emailOrTc,
    required String password,
    required String macAddress,
  }) async {
    emit(AuthLoading());
    try {
      final user = await _repository.login(
        emailOrTc: emailOrTc,
        password: password,
        macAddress: macAddress,
      );
      emit(AuthAuthenticated(user));
    } catch (e) {
      final errorMsg = e.toString().replaceAll('Exception: ', '');
      if (errorMsg.contains('doğrulayın')) {
        // E-posta aktivasyonu yapılmamış
        emit(AuthUnverified(email: emailOrTc, message: errorMsg));
      } else {
        emit(AuthError(errorMsg));
      }
    }
  }

  // Kayıt Ol (Register)
  Future<void> register({
    required String username,
    required String email,
    required String password,
    required String forename,
    required String surname,
    required String tcKimlik,
    required int yearOfBirth,
    required String macAddress,
  }) async {
    emit(AuthLoading());
    try {
      final message = await _repository.register(
        username: username,
        email: email,
        password: password,
        forename: forename,
        surname: surname,
        tcKimlik: tcKimlik,
        yearOfBirth: yearOfBirth,
        macAddress: macAddress,
      );
      emit(AuthRegisterSuccess(email: email, message: message));
    } catch (e) {
      emit(AuthError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  // E-Posta Kodu Doğrulama
  Future<void> verifyCode({
    required String email,
    required String code,
  }) async {
    emit(AuthLoading());
    try {
      final message = await _repository.verifyCode(email: email, code: code);
      emit(AuthRegisterSuccess(email: email, message: '$message Artık şifrenizle giriş yapabilirsiniz.'));
    } catch (e) {
      emit(AuthError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  // Çıkış Yap (Logout)
  Future<void> logout() async {
    emit(AuthLoading());
    await _repository.logout();
    emit(AuthUnauthenticated());
  }

  // Unverified/RegisterState durumundan Login ekranına geri dönüş yardımı
  void resetToLogin() {
    emit(AuthUnauthenticated());
  }

  // Şifremi Unuttum (Forgot Password)
  Future<void> forgotPassword({
    required String tcKimlik,
    required String forename,
    required String surname,
    required String yearOfBirth,
    required String email,
  }) async {
    emit(AuthLoading());
    try {
      final message = await _repository.forgotPassword(
        tcKimlik: tcKimlik,
        forename: forename,
        surname: surname,
        yearOfBirth: yearOfBirth,
        email: email,
      );
      // Başarılı bildirim göstermek için AuthRegisterSuccess durumunu tetikliyoruz
      emit(AuthRegisterSuccess(email: email, message: message));
    } catch (e) {
      emit(AuthError(e.toString().replaceAll('Exception: ', '')));
    }
  }
}
