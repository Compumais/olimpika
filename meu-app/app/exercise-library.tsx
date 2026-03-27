import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { localApi } from '@/api/localApiClient';

export default function ExerciseLibraryScreen() {
  const { data: exercises = [] } = useQuery({
    queryKey: ['exercise-library'],
    queryFn: () => localApi.getTemplateExercises(),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Biblioteca de Exercícios</Text>
      </View>
      <Text style={styles.sub}>
        {(exercises as unknown[]).length} exercícios cadastrados
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  content: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: '#27272a' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  sub: { fontSize: 14, color: '#a1a1aa' },
});
