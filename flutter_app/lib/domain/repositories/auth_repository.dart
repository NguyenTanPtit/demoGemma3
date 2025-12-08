import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthRepository {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  static const _tokenKey = 'auth_token';

  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
  }

  // Mock Login
  Future<bool> login(String username, String password) async {
    await Future.delayed(const Duration(seconds: 1));
    if (username.isNotEmpty && password.isNotEmpty) {
      await saveToken('mock_token_12345');
      return true;
    }
    return false;
  }
}
