import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function StudentWorkoutsScreen() {
  const { student_id, student_name } = useLocalSearchParams<{
    student_id: string;
    student_name: string;
  }>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Treinos - {student_name || 'Aluno'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: '#27272a' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
});
