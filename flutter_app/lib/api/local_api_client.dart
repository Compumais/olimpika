import 'dart:convert';

import 'package:http/http.dart' as http;

/// Cliente HTTP simples para falar com o backend Python.
class LocalApiClient {
  LocalApiClient({this.baseUrl = 'http://localhost:4000'});

  final String baseUrl;

  Uri _uri(String path, [Map<String, String>? query]) {
    final uri = Uri.parse('$baseUrl$path');
    if (query == null || query.isEmpty) return uri;
    return uri.replace(queryParameters: {
      ...uri.queryParameters,
      ...query,
    });
  }

  Exception _errorFromResponse(http.Response res) {
    if (res.body.isNotEmpty) {
      return Exception(res.body);
    }
    return Exception(res.reasonPhrase ?? 'Erro na requisição (${res.statusCode})');
  }

  Future<Map<String, dynamic>> _decodeObject(http.Response res) async {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final body = res.body.isEmpty ? '{}' : res.body;
      return jsonDecode(body) as Map<String, dynamic>;
    }
    throw _errorFromResponse(res);
  }

  Future<List<dynamic>> _decodeList(http.Response res) async {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final body = res.body.isEmpty ? '[]' : res.body;
      return jsonDecode(body) as List<dynamic>;
    }
    throw _errorFromResponse(res);
  }

  // -------------------- Auth --------------------

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      _uri('/auth/login'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    return _decodeObject(res);
  }

  // -------------------- Students --------------------

  Future<List<dynamic>> getStudents() async {
    final res = await http.get(_uri('/students'));
    return _decodeList(res);
  }

  Future<Map<String, dynamic>> createStudent(Map<String, dynamic> data) async {
    final res = await http.post(
      _uri('/students'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode(data),
    );
    return _decodeObject(res);
  }

  // -------------------- Workouts --------------------

  Future<List<dynamic>> getWorkoutsForStudent(String studentId) async {
    final res = await http.get(_uri('/workouts', {'student_id': studentId}));
    return _decodeList(res);
  }

  Future<Map<String, dynamic>> createWorkout(Map<String, dynamic> data) async {
    final res = await http.post(
      _uri('/workouts'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode(data),
    );
    return _decodeObject(res);
  }

  Future<Map<String, dynamic>> updateWorkout(String id, Map<String, dynamic> data) async {
    final res = await http.put(
      _uri('/workouts/$id'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode(data),
    );
    return _decodeObject(res);
  }

  Future<void> deleteWorkout(String id) async {
    final res = await http.delete(_uri('/workouts/$id'));
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw _errorFromResponse(res);
    }
  }

  // -------------------- Workout Sessions --------------------

  Future<Map<String, dynamic>> createQuickWorkoutSession({
    required String userEmail,
    required String workoutId,
    required String workoutName,
  }) async {
    final now = DateTime.now();
    final date = now.toIso8601String().split('T').first;

    final payload = {
      'id': null,
      'user_email': userEmail,
      'workout_id': workoutId,
      'workout_name': workoutName,
      'date': date,
      'start_time': null,
      'end_time': null,
      'duration_minutes': '0',
      'status': 'completed',
      'exercises_completed': '[]',
    };

    final res = await http.post(
      _uri('/workout-sessions'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    return _decodeObject(res);
  }

  Future<List<dynamic>> getWorkoutSessionsByUserEmail(String email) async {
    final res = await http.get(_uri('/workout-sessions', {'user_email': email}));
    return _decodeList(res);
  }

  // -------------------- Exercises --------------------

  Future<List<dynamic>> getExercisesForWorkout(String workoutId) async {
    final res = await http.get(_uri('/exercises', {'workout_id': workoutId}));
    return _decodeList(res);
  }

  Future<Map<String, dynamic>> createExercise(Map<String, dynamic> data) async {
    final res = await http.post(
      _uri('/exercises'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode(data),
    );
    return _decodeObject(res);
  }

  Future<Map<String, dynamic>> updateExercise(String id, Map<String, dynamic> data) async {
    final res = await http.put(
      _uri('/exercises/$id'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode(data),
    );
    return _decodeObject(res);
  }

  Future<void> deleteExercise(String id) async {
    final res = await http.delete(_uri('/exercises/$id'));
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw _errorFromResponse(res);
    }
  }
}
