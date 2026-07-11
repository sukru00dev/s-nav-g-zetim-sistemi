import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/dio_client.dart';
import '../models/user_model.dart';

class AuthRepository {
  final DioClient _client;
  final _storage = const FlutterSecureStorage();

  AuthRepository(this._client);

  // Giriş Yap (Login)
  Future<UserModel> login({
    required String emailOrTc,
    required String password,
    required String macAddress,
  }) async {
    try {
      final response = await _client.post(
        ApiConstants.login,
        data: {
          'email': emailOrTc,
          'password': password,
          'mac_address': macAddress,
        },
      );

      final data = response.data as Map<String, dynamic>;
      final token = data['token'] as String;
      final userJson = data['user'] as Map<String, dynamic>;
      final user = UserModel.fromJson(userJson);

      // Token ve Kullanıcı verilerini güvenli depolamaya kaydet
      await _storage.write(key: 'auth_token', value: token);
      await _storage.write(key: 'user_data', value: jsonEncode(user.toJson()));

      return user;
    } catch (e) {
      rethrow;
    }
  }

  // Kayıt Ol (Register) - Sadece Öğrenci Rolü (roleId = 4)
  Future<String> register({
    required String username,
    required String email,
    required String password,
    required String forename,
    required String surname,
    required String tcKimlik,
    required int yearOfBirth,
    required String macAddress,
  }) async {
    try {
      final response = await _client.post(
        ApiConstants.register,
        data: {
          'username': username,
          'email': email,
          'password': password,
          'roleId': 4, // Varsayılan Öğrenci Rolü
          'forename': forename,
          'surname': surname,
          'tc_kimlik': tcKimlik,
          'yearOfBirth': yearOfBirth,
          'mac_address': macAddress,
        },
      );

      final data = response.data as Map<String, dynamic>;
      return data['message'] as String? ?? 'Kayıt başarılı! Lütfen mailinizi kontrol edin.';
    } catch (e) {
      rethrow;
    }
  }

  // 6 Haneli OTP Kod Doğrulama (Verify Code)
  Future<String> verifyCode({
    required String email,
    required String code,
  }) async {
    try {
      final response = await _client.post(
        ApiConstants.verifyCode,
        data: {
          'email': email,
          'code': code,
        },
      );

      final data = response.data as Map<String, dynamic>;
      return data['message'] as String? ?? 'Hesabınız başarıyla aktifleştirildi.';
    } catch (e) {
      rethrow;
    }
  }

  // Çıkış Yap (Logout)
  Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'user_data');
  }

  // Aktif Giriş Yapan Kullanıcıyı Yükle (Auto Login check)
  Future<UserModel?> getAuthenticatedUser() async {
    final userJson = await _storage.read(key: 'user_data');
    if (userJson != null) {
      try {
        return UserModel.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  // Kayıtlı Token Var mı Kontrol Et
  Future<bool> hasToken() async {
    final token = await _storage.read(key: 'auth_token');
    return token != null;
  }

  // Şifre Sıfırlama Bağlantısı Gönder (Forgot Password)
  Future<String> forgotPassword({
    required String tcKimlik,
    required String forename,
    required String surname,
    required String yearOfBirth,
    required String email,
  }) async {
    try {
      final response = await _client.post(
        ApiConstants.forgotPassword,
        data: {
          'tc_kimlik': tcKimlik,
          'forename': forename,
          'surname': surname,
          'yearOfBirth': yearOfBirth,
          'email': email,
        },
      );
      final data = response.data as Map<String, dynamic>;
      return data['message'] as String? ?? 'Şifre sıfırlama bağlantısı e-postanıza gönderildi.';
    } catch (e) {
      rethrow;
    }
  }
}
