import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/local_api_client.dart';
import '../state/auth_state.dart';
import 'student_history_screen.dart';

class StudentHomeScreen extends StatefulWidget {
  const StudentHomeScreen({super.key});

  @override
  State<StudentHomeScreen> createState() => _StudentHomeScreenState();
}

class _StudentHomeScreenState extends State<StudentHomeScreen> {
  final _api = LocalApiClient();
  Future<List<dynamic>>? _futureWorkouts;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final auth = context.read<AuthState>();
    final user = auth.user;
    final studentId = user?['student_id'] as String?;

    if (_futureWorkouts == null && studentId != null) {
      _futureWorkouts = _api.getWorkoutsForStudent(studentId);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final user = auth.user;

    if (user == null || user['user_type'] != 'aluno') {
      return const Scaffold(
        body: Center(
          child: Text('Esta tela ? apenas para alunos.'),
        ),
      );
    }

    final email = user['email'] as String? ?? '';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Meus treinos - Olimpika Fitness'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            tooltip: 'Hist?rico de treinos',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const StudentHistoryScreen(),
                ),
              );
            },
          ),
        ],
      ),
      body: _futureWorkouts == null
          ? const Center(
              child: Text('Nenhum treino associado a este aluno.'),
            )
          : FutureBuilder<List<dynamic>>(
              future: _futureWorkouts,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(
                    child: Text(
                      'Erro ao carregar treinos:\n${snapshot.error}',
                      textAlign: TextAlign.center,
                    ),
                  );
                }
                final workouts = snapshot.data ?? [];
                if (workouts.isEmpty) {
                  return const Center(
                    child: Text('Voc? ainda n?o tem treinos cadastrados.'),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: workouts.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final w = workouts[index] as Map<String, dynamic>;
                    final name = w['name'] as String? ?? 'Treino';
                    final short = w['short_name'] as String? ?? '';
                    final color = _parseColor(w['color'] as String?);

                    return Card(
                      color: const Color(0xFF18181B),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(color: color.withOpacity(0.5)),
                      ),
                      child: ListTile(
                        title: Text(
                          name,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: short.isNotEmpty
                            ? Text(short, style: const TextStyle(color: Colors.grey))
                            : null,
                        trailing: ElevatedButton(
                          onPressed: () async {
                            try {
                              await _api.createQuickWorkoutSession(
                                userEmail: email,
                                workoutId: w['id'] as String,
                                workoutName: name,
                              );
                              if (!mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Treino registrado no hist?rico!'),
                                ),
                              );
                            } catch (e) {
                              if (!mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Erro ao registrar treino: $e'),
                                ),
                              );
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.yellow,
                            foregroundColor: Colors.black,
                          ),
                          child: const Text('Registrar'),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
    );
  }

  Color _parseColor(String? colorClass) {
    // Mapeia algumas cores Tailwind usadas no app web para cores Flutter.
    switch (colorClass) {
      case 'bg-blue-500':
        return Colors.blue;
      case 'bg-green-500':
        return Colors.green;
      case 'bg-red-500':
        return Colors.red;
      case 'bg-purple-500':
        return Colors.purple;
      case 'bg-pink-500':
        return Colors.pink;
      case 'bg-yellow-500':
      default:
        return Colors.yellow;
    }
  }
}
