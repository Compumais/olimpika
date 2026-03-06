import 'package:flutter/material.dart';

import '../api/local_api_client.dart';
import 'personal_student_workouts_screen.dart';

class PersonalHomeScreen extends StatefulWidget {
  const PersonalHomeScreen({super.key});

  @override
  State<PersonalHomeScreen> createState() => _PersonalHomeScreenState();
}

class _PersonalHomeScreenState extends State<PersonalHomeScreen> {
  final _api = LocalApiClient();
  late Future<List<dynamic>> _futureStudents;

  @override
  void initState() {
    super.initState();
    _futureStudents = _api.getStudents();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Meus alunos - Olimpika Fitness'),
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _futureStudents,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Text(
                'Erro ao carregar alunos:\n${snapshot.error}',
                textAlign: TextAlign.center,
              ),
            );
          }
          final students = snapshot.data ?? [];
          if (students.isEmpty) {
            return const Center(
              child: Text('Nenhum aluno cadastrado ainda.'),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: students.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final s = students[index] as Map<String, dynamic>;
              final name = s['name'] as String? ?? 'Aluno';
              final email = s['email'] as String? ?? '';
              final goal = s['goal'] as String? ?? '';

              return Card(
                color: const Color(0xFF18181B),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: const BorderSide(color: Color(0xFF27272A)),
                ),
                child: ListTile(
                  title: Text(
                    name,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (email.isNotEmpty)
                        Text(
                          email,
                          style: const TextStyle(color: Colors.grey, fontSize: 12),
                        ),
                      if (goal.isNotEmpty)
                        Text(
                          goal,
                          style: const TextStyle(color: Colors.yellow, fontSize: 12),
                        ),
                    ],
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => PersonalStudentWorkoutsScreen(student: s),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
