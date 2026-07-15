import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:olimpika_flutter/models/app_user.dart';
import 'package:olimpika_flutter/models/workout_session.dart';
import 'package:olimpika_flutter/services/api_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.user});

  final AppUser user;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _api = ApiService();
  List<WorkoutSession> _sessions = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadSessions();
  }

  Future<void> _loadSessions() async {
    try {
      final sessions = await _api.getWorkoutSessionsByEmail(widget.user.email);
      if (!mounted) return;
      setState(() {
        _sessions = sessions;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Text(
          'Erro ao carregar dados:\n$_error',
          textAlign: TextAlign.center,
        ),
      );
    }

    final completed = _sessions.where((s) => s.status == 'completed').toList();
    final thisMonth = completed.where((s) {
      final now = DateTime.now();
      return s.date.month == now.month && s.date.year == now.year;
    }).toList();

    return RefreshIndicator(
      onRefresh: _loadSessions,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Ola, ${widget.user.fullName.isEmpty ? 'Atleta' : widget.user.fullName}',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'Resumo dos seus treinos',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: Colors.white70),
          ),
          const SizedBox(height: 20),
          _metricCard('Treinos concluidos', '${completed.length}'),
          const SizedBox(height: 10),
          _metricCard('Treinos este mes', '${thisMonth.length}'),
          const SizedBox(height: 24),
          Text('Atividade recente', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 10),
          if (completed.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text('Nenhum treino registrado ainda.'),
              ),
            ),
          ...completed.take(5).map(
            (session) => ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 0),
              leading: const CircleAvatar(child: Icon(Icons.fitness_center)),
              title: Text(session.workoutName),
              subtitle: Text(
                '${DateFormat('dd/MM/yyyy').format(session.date)} • ${session.durationMinutes} min',
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _metricCard(String label, String value) {
    return Card(
      child: ListTile(
        title: Text(label),
        trailing: Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
