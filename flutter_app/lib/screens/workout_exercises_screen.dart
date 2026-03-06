import 'package:flutter/material.dart';

import '../api/local_api_client.dart';

class WorkoutExercisesScreen extends StatefulWidget {
  const WorkoutExercisesScreen({super.key, required this.workout});

  final Map<String, dynamic> workout;

  @override
  State<WorkoutExercisesScreen> createState() => _WorkoutExercisesScreenState();
}

class _WorkoutExercisesScreenState extends State<WorkoutExercisesScreen> {
  final _api = LocalApiClient();
  late Future<List<dynamic>> _futureExercises;

  @override
  void initState() {
    super.initState();
    _futureExercises = _api.getExercisesForWorkout(widget.workout['id'] as String);
  }

  Future<void> _reload() async {
    setState(() {
      _futureExercises = _api.getExercisesForWorkout(widget.workout['id'] as String);
    });
  }

  Future<void> _openExerciseForm({Map<String, dynamic>? exercise}) async {
    final nameController = TextEditingController(text: exercise?['name'] as String? ?? '');
    final setsController = TextEditingController(text: exercise?['sets']?.toString() ?? '');
    final repsController = TextEditingController(text: exercise?['reps'] as String? ?? '');
    final weightController = TextEditingController(text: exercise?['weight'] as String? ?? '');

    final isEditing = exercise != null;

    final result = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF18181B),
          title: Text(isEditing ? 'Editar exercício' : 'Novo exercício'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Nome do exercício'),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: setsController,
                  decoration: const InputDecoration(labelText: 'Séries (ex: 3 ou 4)'),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: repsController,
                  decoration: const InputDecoration(labelText: 'Repetições (ex: 12 ou 12, 10, 8, 8)'),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: weightController,
                  decoration: const InputDecoration(labelText: 'Carga (ex: 30kg)'),
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
      'workout_id': widget.workout['id'],
      'name': name,
      'sets': setsController.text.trim(),
      'reps': repsController.text.trim(),
      'weight': weightController.text.trim(),
    };

    try {
      if (isEditing) {
        await _api.updateExercise(exercise!['id'] as String, payload);
      } else {
        await _api.createExercise(payload);
      }
      if (!mounted) return;
      await _reload();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao salvar exercício: $e')),
      );
    }
  }

  Future<void> _deleteExercise(Map<String, dynamic> exercise) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF18181B),
        title: const Text('Excluir exercício'),
        content: Text('Tem certeza que deseja excluir "${exercise['name']}"?'),
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
      await _api.deleteExercise(exercise['id'] as String);
      if (!mounted) return;
      await _reload();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao excluir exercício: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final workoutName = widget.workout['name'] as String? ?? 'Treino';

    return Scaffold(
      appBar: AppBar(
        title: Text('Exercícios - $workoutName'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _openExerciseForm(),
        backgroundColor: Colors.yellow,
        foregroundColor: Colors.black,
        child: const Icon(Icons.add),
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _futureExercises,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Text(
                'Erro ao carregar exercícios:\n${snapshot.error}',
                textAlign: TextAlign.center,
              ),
            );
          }
          final exercises = snapshot.data ?? [];
          if (exercises.isEmpty) {
            return const Center(child: Text('Nenhum exercício cadastrado ainda.'));
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: exercises.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final e = exercises[index] as Map<String, dynamic>;
              final name = e['name'] as String? ?? 'Exercício';
              final sets = e['sets']?.toString() ?? '';
              final reps = e['reps'] as String? ?? '';
              final weight = e['weight'] as String? ?? '';

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
                  subtitle: Text(
                    [
                      if (sets.isNotEmpty) '$sets séries',
                      if (reps.isNotEmpty) reps,
                      if (weight.isNotEmpty) weight,
                    ].join(' • '),
                  ),
                  onTap: () => _openExerciseForm(exercise: e),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline),
                    onPressed: () => _deleteExercise(e),
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
