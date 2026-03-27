import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { localApi } from '@/api/localApiClient';

export default function ManageExercisesScreen() {
  const { workout_id } = useLocalSearchParams<{ workout_id: string }>();
  const { data: workout } = useQuery({
    queryKey: ['workout', workout_id],
    queryFn: () => localApi.getWorkoutById(workout_id || ''),
    enabled: !!workout_id,
  });
  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises', workout_id],
    queryFn: () => localApi.getExercisesByWorkoutId(workout_id || ''),
    enabled: !!workout_id,
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.title}>
          {(workout as { name?: string })?.name || 'Exercícios'}
        </Text>
      </View>
      <Text style={styles.sub}>
        {(exercises as unknown[]).length} exercícios neste treino
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: '#27272a' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  sub: { fontSize: 14, color: '#a1a1aa' },
});
