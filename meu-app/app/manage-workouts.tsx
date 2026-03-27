import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { localApi } from '@/api/localApiClient';
import { useAuth } from '@/lib/AuthContext';

export default function ManageWorkoutsScreen() {
  const { user } = useAuth();
  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts'],
    queryFn: () => localApi.getWorkouts(),
    enabled: !!user,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Gerenciar Treinos</Text>
      </View>
      <Text style={styles.sub}>
        {(workouts as unknown[]).length} treinos cadastrados
      </Text>
      {(workouts as { id: string; name?: string; short_name?: string }[]).map((w) => (
        <Pressable
          key={w.id}
          onPress={() =>
            router.push({ pathname: '/manage-exercises', params: { workout_id: w.id } })
          }
          style={styles.card}
        >
          <Text style={styles.cardName}>{w.name}</Text>
          <Text style={styles.cardShort}>{w.short_name}</Text>
          <Ionicons name="chevron-forward" size={20} color="#71717a" />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  content: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: '#27272a' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  sub: { fontSize: 14, color: '#a1a1aa', marginBottom: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24,24,27,0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    marginBottom: 12,
  },
  cardName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#fff' },
  cardShort: { fontSize: 14, color: '#71717a', marginRight: 8 },
});
