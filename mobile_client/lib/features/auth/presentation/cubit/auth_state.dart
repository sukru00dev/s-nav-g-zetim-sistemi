import '../../data/models/user_model.dart';

abstract class AuthState {}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class AuthAuthenticated extends AuthState {
  final UserModel user;
  AuthAuthenticated(this.user);
}

// Hesap e-posta adresi doğrulanmamış durumu
class AuthUnverified extends AuthState {
  final String email;
  final String message;
  AuthUnverified({required this.email, required this.message});
}

class AuthUnauthenticated extends AuthState {}

class AuthRegisterSuccess extends AuthState {
  final String email;
  final String message;
  AuthRegisterSuccess({required this.email, required this.message});
}

class AuthError extends AuthState {
  final String message;
  AuthError(this.message);
}
