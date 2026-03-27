import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { localApi } from '@/api/localApiClient';
import { useAuth } from '@/lib/AuthContext';
import WorkoutCard from '@/components/workout/WorkoutCard';
import { Skeleton } from '@/components/ui/Skeleton';

export default function SelectWorkoutScreen() {
  const { user } = useAuth();
  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['workouts', user?.user_type, (user as { student_id?: string })?.student_id],
    queryFn: () => {
      const u = user as { user_type?: string; student_id?: string };
      if (u?.user_type === 'aluno' && u?.student_id) {
        return localApi.getWorkouts({ student_id: u.student_id });
      }
      return localApi.getWorkouts();
    },
    enabled: !!user,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Selecionar Treino</Text>
      </View>
      <Text style={styles.sub}>Escolha o treino que deseja realizar hoje:</Text>
      {isLoading ? (
        <View style={styles.skeletonWrap}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={128} style={styles.skeleton} />
          ))}
        </View>
      ) : workouts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nenhum treino disponível</Text>
        </View>
      ) : (
        <View style={styles.workoutsList}>
          {(workouts as { id: string; name?: string; short_name?: string; estimated_duration?: number; muscle_groups?: unknown[] }[]).map((workout, index) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              index={index}
              onClick={() =>
                router.push({ pathname: '/active-workout', params: { workout_id: workout.id } })
              }
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  content: { padding: 20, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: '#27272a' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  sub: { fontSize: 14, color: '#a1a1aa', marginBottom: 24 },
  skeletonWrap: { gap: 16 },
  skeleton: { marginBottom: 16 },
  empty: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { color: '#71717a' },
  workoutsList: { gap: 20 },
});
