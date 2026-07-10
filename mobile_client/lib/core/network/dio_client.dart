import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/api_constants.dart';

class DioClient {
  final Dio _dio;
  final _storage = const FlutterSecureStorage();

  DioClient() : _dio = Dio() {
    _dio.options = BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Tokenı güvenli depolamadan oku ve isteğe ekle
          final token = await _storage.read(key: 'auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          // Hata durumunda akıllı yeniden deneme (Smart Retry) mekanizması
          if (_shouldRetry(e)) {
            try {
              // 2 saniye bekle ve tekrar dene
              await Future.delayed(const Duration(seconds: 2));
              final response = await _retry(e.requestOptions);
              return handler.resolve(response);
            } catch (retryError) {
              return handler.next(e);
            }
          }
          return handler.next(e);
        },
      ),
    );
  }

  Dio get dio => _dio;

  bool _shouldRetry(DioException err) {
    return err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.sendTimeout ||
        (err.type == DioExceptionType.unknown && err.error is SocketException);
  }

  Future<Response<dynamic>> _retry(RequestOptions requestOptions) {
    final options = Options(
      method: requestOptions.method,
      headers: requestOptions.headers,
    );
    return _dio.request<dynamic>(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: options,
    );
  }

  // HTTP GET Yardımcısı
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // HTTP POST Yardımcısı
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(DioException error) {
    if (error.response != null) {
      final data = error.response?.data;
      if (data is Map && data.containsKey('message')) {
        return Exception(data['message']);
      }
      return Exception('Sunucu hatası: ${error.response?.statusCode}');
    }
    
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return Exception('Bağlantı zaman aşımına uğradı. Lütfen internetinizi kontrol edin.');
      case DioExceptionType.connectionError:
        return Exception('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
      default:
        return Exception('Beklenmedik bir ağ hatası oluştu.');
    }
  }
}
