class WorkoutSession {
  const WorkoutSession({
    required this.id,
    required this.workoutName,
    required this.status,
    required this.date,
    required this.durationMinutes,
  });

  final int id;
  final String workoutName;
  final String status;
  final DateTime date;
  final int durationMinutes;

  factory WorkoutSession.fromJson(Map<String, dynamic> json) {
    return WorkoutSession(
      id: (json['id'] ?? 0) as int,
      workoutName: (json['workout_name'] ?? 'Treino') as String,
      status: (json['status'] ?? '') as String,
      date: DateTime.tryParse((json['date'] ?? '').toString()) ?? DateTime.now(),
      durationMinutes: int.tryParse((json['duration_minutes'] ?? 0).toString()) ?? 0,
    );
  }
}
