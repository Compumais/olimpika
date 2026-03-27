import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Color = 'yellow' | 'amber' | 'orange' | 'red';

type StatsCardProps = {
  icon: keyof typeof Ionicons.glyphMap | string;
  label: string;
  value: string | number;
  color?: Color;
};

const colorMap: Record<Color, { bg: string; text: string; border: string }> = {
  yellow: { bg: 'rgba(234,179,8,0.1)', text: '#eab308', border: 'rgba(234,179,8,0.2)' },
  amber: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  orange: { bg: 'rgba(249,115,22,0.1)', text: '#f97316', border: 'rgba(249,115,22,0.2)' },
  red: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.2)' },
};

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  flame: 'flame',
  trophy: 'trophy',
  calendar: 'calendar',
  trendingUp: 'trending-up',
};

export default function StatsCard({ icon, label, value, color = 'yellow' }: StatsCardProps) {
  const c = colorMap[color];
  const iconName = (typeof icon === 'string' ? iconMap[icon] || icon : icon) as keyof typeof Ionicons.glyphMap;
  return (
    <View style={[styles.card, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: c.bg }]}>
        <Ionicons name={iconName} size={18} color={c.text} />
      </View>
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    padding: 6,
    borderRadius: 10,
  },
  label: {
    fontSize: 11,
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
