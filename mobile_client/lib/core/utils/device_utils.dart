import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

class DeviceUtils {
  // Cihaz için kalıcı benzersiz ID üretir (Kayıt ve girişteki mac_address yerine kullanılır)
  static Future<String> getDeviceId() async {
    final prefs = await SharedPreferences.getInstance();
    String? deviceId = prefs.getString('device_id');
    
    if (deviceId == null) {
      // Rastgele ve benzersiz bir UUIDv4 kodu oluştur
      deviceId = const Uuid().v4().replaceAll('-', '').substring(0, 16);
      await prefs.setString('device_id', deviceId);
    }
    
    return deviceId;
  }
}
