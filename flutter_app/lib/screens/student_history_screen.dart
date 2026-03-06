import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/local_api_client.dart';
import '../state/auth_state.dart';

class StudentHistoryScreen extends StatefulWidget {
  const StudentHistoryScreen({super.key});

  @override
  State<StudentHistoryScreen> createState() => _StudentHistoryScreenState();
}

class _StudentHistoryScreenState extends State<StudentHistoryScreen> {
  final _api = LocalApiClient();
  Future<List<dynamic>>? _futureSessions;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final auth = context.read<AuthState>();
    final user = auth.user;
    final email = user?['email'] as String?;

    if (_futureSessions == null && email != null) {
      _futureSessions = _api.getWorkoutSessionsByUserEmail(email);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final user = auth.user;

    if (user == null || user['user_type'] != 'aluno') {
      return const Scaffold(
        body: Center(
          child: Text('Histórico disponível apenas para alunos.'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Histórico de treinos'),
      ),
      body: _futureSessions == null
          ? const Center(
              child: Text('Nenhum treino registrado ainda.'),
            )
          : FutureBuilder<List<dynamic>>(
              future: _futureSessions,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(
                    child: Text(
                      'Erro ao carregar histórico:\n${snapshot.error}',
                      textAlign: TextAlign.center,
                    ),
                  );
                }
                final sessions = snapshot.data ?? [];
                if (sessions.isEmpty) {
                  return const Center(
                    child: Text('Você ainda não possui treinos no histórico.'),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: sessions.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final s = sessions[index] as Map<String, dynamic>;
                    final workoutName = s['workout_name'] as String? ?? 'Treino';
                    final date = s['date'] as String? ?? '';
                    final duration = s['duration_minutes'] as String? ?? '';
                    final exercisesCompleted = s['exercises_completed'] as String? ?? '';
                    final status = s['status'] as String? ?? '';

                    return Card(
                      color: const Color(0xFF18181B),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: const BorderSide(color: Color(0xFF27272A)),
                      ),
                      child: ListTile(
                        title: Text(
                          workoutName,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (date.isNotEmpty)
                              Text(
                                'Data: $date',
                                style: const TextStyle(color: Colors.grey, fontSize: 12),
                              ),
                            if (duration.isNotEmpty)
                              Text(
                                'Duração: $duration min',
                                style: const TextStyle(color: Colors.grey, fontSize: 12),
                              ),
                            if (exercisesCompleted.isNotEmpty)
                              Text(
                                'Exercícios: $exercisesCompleted',
                                style: const TextStyle(color: Colors.grey, fontSize: 12),
                              ),
                            if (status.isNotEmpty)
                              Text(
                                'Status: $status',
                                style: const TextStyle(color: Colors.yellow, fontSize: 12),
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
    );
  }
}
