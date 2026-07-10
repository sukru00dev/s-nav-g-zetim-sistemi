import 'package:shared_preferences/shared_preferences.dart';

class LocalDbManager {
  static SharedPreferences? _prefs;

  // Başlangıç kurulumu (main.dart içinde çağrılacaktır)
  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // String Değer Kaydetme
  static Future<bool> setString(String key, String value) async {
    return await _prefs?.setString(key, value) ?? false;
  }

  // String Değer Okuma
  static String? getString(String key) {
    return _prefs?.getString(key);
  }

  // Boolean Değer Kaydetme
  static Future<bool> setBool(String key, bool value) async {
    return await _prefs?.setBool(key, value) ?? false;
  }

  // Boolean Değer Okuma
  static bool getBool(String key, {bool defaultValue = false}) {
    return _prefs?.getBool(key) ?? defaultValue;
  }

  // Anahtar Silme
  static Future<bool> remove(String key) async {
    return await _prefs?.remove(key) ?? false;
  }

  // Tüm Verileri Temizleme
  static Future<bool> clear() async {
    return await _prefs?.clear() ?? false;
  }
}
