class ApiConstants {
  // Canlı Sunucu API Adresi
  static const String baseUrl = 'http://140.245.7.158:5001/api';
  
  // Yerel Geliştirme API Adresi (Gerektiğinde emulator için 10.0.2.2 kullanılabilir)
  // static const String baseUrl = 'http://10.0.2.2:5001/api';

  // Auth Endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String verifyCode = '/auth/verify-code';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';

  // Exams & Sessions Endpoints
  static const String getStudentExams = '/users/me/exams';
  static const String startSession = '/exams/{examId}/session/start';
  static const String submitAnswer = '/exams/{examId}/session/answer';
  static const String endSession = '/exams/{examId}/session/end';
  static const String logBiometrics = '/biometrics/log';
  static const String ping = '/ping';
}
