import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { localApi } from '@/api/localApiClient';
import { useAuth } from '@/lib/AuthContext';
import WorkoutCard from '@/components/workout/WorkoutCard';
import { Skeleton } from '@/components/ui/Skeleton';

export default function WorkoutsScreen() {
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

  const handleSelectWorkout = (workout: { id: string }) => {
    router.push({ pathname: '/active-workout', params: { workout_id: workout.id } });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Treinos</Text>
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
          <View style={styles.emptyIcon}>
            <Ionicons name="add" size={40} color="#52525b" />
          </View>
          <Text style={styles.emptyTitle}>Nenhum treino disponível</Text>
          <Text style={styles.emptySub}>
            {(user as { user_type?: string })?.user_type === 'aluno'
              ? 'Seu personal ainda não cadastrou treinos para você. Peça para ele criar e vincular treinos ao seu perfil.'
              : 'Crie seu primeiro treino para começar'}
          </Text>
          {(user as { user_type?: string })?.user_type !== 'aluno' && (
            <Pressable
              onPress={() => router.push('/manage-workouts')}
              style={styles.createBtn}
            >
              <Text style={styles.createBtnText}>Criar Treino</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={styles.workoutsList}>
          {(workouts as { id: string; name?: string; short_name?: string; estimated_duration?: number; muscle_groups?: unknown[] }[]).map((workout, index) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              index={index}
              onClick={() => handleSelectWorkout(workout)}
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
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  sub: { fontSize: 14, color: '#a1a1aa', marginBottom: 24 },
  skeletonWrap: { gap: 16 },
  skeleton: { marginBottom: 16 },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptySub: {
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  createBtn: {
    backgroundColor: '#eab308',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBtnText: { fontSize: 16, fontWeight: '600', color: '#000' },
  workoutsList: {
    gap: 20,
  },
});
