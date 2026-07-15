import 'package:olimpika_flutter/core/constants.dart';
import 'package:olimpika_flutter/models/app_user.dart';
import 'package:olimpika_flutter/services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  AuthService({ApiService? apiService}) : _api = apiService ?? ApiService();

  final ApiService _api;
  AppUser? _user;

  AppUser? get user => _user;
  bool get isAuthenticated => _user != null;

  Future<void> restoreUser() async {
    final prefs = await SharedPreferences.getInstance();
    final rawUser = prefs.getString(AppConstants.storageUserKey);
    if (rawUser == null || rawUser.isEmpty) return;
    _user = AppUser.decode(rawUser);
  }

  Future<AppUser> login(String email, String password) async {
    final user = await _api.login(email, password);
    await _persistUser(user);
    return user;
  }

  Future<AppUser> register({
    required String fullName,
    required String email,
    required String password,
    required String userType,
  }) async {
    final user = await _api.register(
      fullName: fullName,
      email: email,
      password: password,
      userType: userType,
    );
    await _persistUser(user);
    return user;
  }

  Future<void> resetPassword(String email, String newPassword) {
    return _api.resetPassword(email, newPassword);
  }

  Future<void> logout() async {
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.storageUserKey);
  }

  Future<void> _persistUser(AppUser user) async {
    _user = user;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.storageUserKey, user.encode());
  }
}
