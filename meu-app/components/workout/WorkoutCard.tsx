import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type WorkoutCardProps = {
  workout: { id: string; name: string; short_name?: string; estimated_duration?: number; muscle_groups?: unknown[] };
  onClick: () => void;
  index: number;
};

const gradients = [
  ['#ca8a04', '#854d0e'],
  ['#d97706', '#9a3412'],
  ['#ea580c', '#c2410c'],
  ['#eab308', '#a16207'],
  ['#f59e0b', '#b45309'],
];

export default function WorkoutCard({ workout, onClick, index }: WorkoutCardProps) {
  const [from, to] = gradients[index % gradients.length];
  return (
    <Pressable
      onPress={onClick}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: from },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.orb1} />
      <View style={styles.orb2} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{workout.short_name || workout.name?.slice(0, 2) || '?'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
        </View>
        <Text style={styles.name}>{workout.name}</Text>
        <View style={styles.meta}>
          {workout.estimated_duration != null && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.metaText}>{workout.estimated_duration} min</Text>
            </View>
          )}
          {workout.muscle_groups?.length > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="barbell-outline" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.metaText}>{workout.muscle_groups.length} grupos</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 18,
    position: 'relative',
  },
  pressed: {
    opacity: 0.95,
  },
  orb1: {
    position: 'absolute',
    top: -36,
    right: -36,
    width: 115,
    height: 115,
    borderRadius: 58,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  orb2: {
    position: 'absolute',
    bottom: -36,
    left: -36,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    position: 'relative',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badge: {
    width: 43,
    height: 43,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
});
