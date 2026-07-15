import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:olimpika_flutter/core/constants.dart';
import 'package:olimpika_flutter/models/app_user.dart';
import 'package:olimpika_flutter/models/workout_session.dart';

class ApiService {
  Uri _uri(String path, [Map<String, String>? query]) {
    final base = Uri.parse(AppConstants.apiBaseUrl);
    return base.replace(
      path: '${base.path}$path',
      queryParameters: query?.isEmpty == true ? null : query,
    );
  }

  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, String>? query,
    Map<String, dynamic>? body,
  }) async {
    final uri = _uri(path, query);
    final headers = <String, String>{'Content-Type': 'application/json'};

    late final http.Response response;
    switch (method) {
      case 'GET':
        response = await http.get(uri, headers: headers);
      case 'POST':
        response = await http.post(uri, headers: headers, body: jsonEncode(body));
      case 'PUT':
        response = await http.put(uri, headers: headers, body: jsonEncode(body));
      default:
        throw Exception('Metodo HTTP nao suportado.');
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_readErrorMessage(response.body, response.statusCode));
    }

    if (response.body.isEmpty) return {};
    final decoded = jsonDecode(response.body);
    if (decoded is Map<String, dynamic>) return decoded;
    throw Exception('Resposta inesperada da API.');
  }

  Future<List<dynamic>> _requestList(
    String path, {
    Map<String, String>? query,
  }) async {
    final uri = _uri(path, query);
    final response = await http.get(
      uri,
      headers: const {'Content-Type': 'application/json'},
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_readErrorMessage(response.body, response.statusCode));
    }
    if (response.body.isEmpty) return [];
    final decoded = jsonDecode(response.body);
    if (decoded is List) return decoded;
    return [];
  }

  String _readErrorMessage(String rawBody, int statusCode) {
    if (rawBody.isEmpty) return 'Erro HTTP $statusCode';
    try {
      final parsed = jsonDecode(rawBody);
      if (parsed is Map<String, dynamic> && parsed['detail'] != null) {
        return parsed['detail'].toString();
      }
    } catch (_) {}
    return rawBody;
  }

  Future<AppUser> login(String email, String password) async {
    final data = await _request(
      'POST',
      '/auth/login',
      body: {'email': email, 'password': password},
    );
    return AppUser.fromJson(data);
  }

  Future<AppUser> register({
    required String fullName,
    required String email,
    required String password,
    required String userType,
  }) async {
    final data = await _request(
      'POST',
      '/auth/register',
      body: {
        'full_name': fullName,
        'email': email,
        'password': password,
        'user_type': userType,
      },
    );
    return AppUser.fromJson(data);
  }

  Future<void> resetPassword(String email, String newPassword) async {
    await _request(
      'POST',
      '/auth/reset-password',
      body: {'email': email, 'new_password': newPassword},
    );
  }

  Future<List<WorkoutSession>> getWorkoutSessionsByEmail(String email) async {
    if (email.isEmpty) return [];
    final rows = await _requestList('/workout-sessions', query: {'user_email': email});
    return rows
        .whereType<Map<String, dynamic>>()
        .map(WorkoutSession.fromJson)
        .toList();
  }
}
