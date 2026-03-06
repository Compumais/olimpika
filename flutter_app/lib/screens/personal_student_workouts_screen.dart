import 'package:flutter/material.dart';

import '../api/local_api_client.dart';
import 'workout_exercises_screen.dart';

class PersonalStudentWorkoutsScreen extends StatefulWidget {
  const PersonalStudentWorkoutsScreen({super.key, required this.student});

  final Map<String, dynamic> student;

  @override
  State<PersonalStudentWorkoutsScreen> createState() => _PersonalStudentWorkoutsScreenState();
}

class _PersonalStudentWorkoutsScreenState extends State<PersonalStudentWorkoutsScreen> {
  final _api = LocalApiClient();
  late Future<List<dynamic>> _futureWorkouts;

  @override
  void initState() {
    super.initState();
    final id = widget.student['id'] as String?;
    _futureWorkouts = id != null ? _api.getWorkoutsForStudent(id) : Future.value([]);
  }

  Future<void> _reload() async {
    final id = widget.student['id'] as String?;
    if (id == null) return;
    setState(() {
      _futureWorkouts = _api.getWorkoutsForStudent(id);
    });
  }

  Future<void> _openWorkoutForm({Map<String, dynamic>? workout}) async {
    final nameController = TextEditingController(text: workout?['name'] as String? ?? '');
    final shortController = TextEditingController(text: workout?['short_name'] as String? ?? '');
    final descController = TextEditingController(text: workout?['description'] as String? ?? '');

    final isEditing = workout != null;

    final result = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF18181B),
          title: Text(isEditing ? 'Editar treino' : 'Novo treino'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Nome do treino'),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: shortController,
                  decoration: const InputDecoration(labelText: 'Apelido (opcional)'),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: descController,
                  decoration: const InputDecoration(labelText: 'Descrição (opcional)'),
                  maxLines: 3,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Salvar'),
            ),
          ],
        );
      },
    );

    if (result != true) return;

    final name = nameController.text.trim();
    if (name.isEmpty) return;

    final payload = <String, dynamic>{
      'student_id': widget.student['id'],
      'name': name,
      'short_name': shortController.text.trim(),
      'description': descController.text.trim(),
      'color': workout?['color'] ?? 'bg-blue-500',
    };

    try {
      if (isEditing) {
        await _api.updateWorkout(workout!['id'] as String, payload);
      } else {
        await _api.createWorkout(payload);
      }
      if (!mounted) return;
      await _reload();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao salvar treino: $e')),
      );
    }
  }

  Future<void> _deleteWorkout(Map<String, dynamic> workout) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF18181B),
        title: const Text('Excluir treino'),
        content: Text('Tem certeza que deseja excluir o treino "${workout['name']}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    try {
      await _api.deleteWorkout(workout['id'] as String);
      if (!mounted) return;
      await _reload();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao excluir treino: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final studentName = widget.student['name'] as String? ?? 'Aluno';

    return Scaffold(
      appBar: AppBar(
        title: Text('Treinos de $studentName'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _openWorkoutForm(),
        backgroundColor: Colors.yellow,
        foregroundColor: Colors.black,
        child: const Icon(Icons.add),
      ),
      body: FutureBuilder<List<dynamic>>(
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
            return const Center(child: Text('Nenhum treino cadastrado ainda.'));
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: workouts.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final w = workouts[index] as Map<String, dynamic>;
              final name = w['name'] as String? ?? 'Treino';
              final short = w['short_name'] as String? ?? '';

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
                  subtitle: short.isNotEmpty
                      ? Text(short, style: const TextStyle(color: Colors.grey))
                      : null,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => WorkoutExercisesScreen(workout: w),
                      ),
                    );
                  },
                  trailing: PopupMenuButton<String>(
                    onSelected: (value) {
                      if (value == 'edit') {
                        _openWorkoutForm(workout: w);
                      } else if (value == 'delete') {
                        _deleteWorkout(w);
                      }
                    },
                    itemBuilder: (context) => const [
                      PopupMenuItem(
                        value: 'edit',
                        child: Text('Editar'),
                      ),
                      PopupMenuItem(
                        value: 'delete',
                        child: Text('Excluir'),
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
