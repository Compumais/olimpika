import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  getDay,
  subMonths,
  addMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

type Session = {
  id: string;
  date?: string;
  workout_name?: string;
  short_name?: string;
  status?: string;
};

function getSigla(session: Session): string {
  if (session.short_name && session.short_name.length <= 4) {
    return session.short_name.toUpperCase();
  }
  const name = session.workout_name || '';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '?';
}

type CalendarHeatmapProps = {
  sessions: Session[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
};

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function CalendarHeatmap({
  sessions,
  currentMonth,
  onMonthChange,
}: CalendarHeatmapProps) {
  const { width } = useWindowDimensions();
  const cellSize = Math.floor((width - 40 - 40 - 8) / 7) - 2; // 7 cols, mais espaço p/ sigla
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const calendarDays = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPadding = getDay(monthStart);
    const paddedDays: (Date | null)[] = [];
    for (let i = 0; i < startPadding; i++) {
      paddedDays.push(null);
    }
    return [...paddedDays, ...days];
  }, [monthStart, monthEnd]);

  const getSessionsForDay = (date: Date | null) => {
    if (!date) return [];
    return sessions.filter(
      (s) =>
        isSameDay(new Date(s.date || ''), date) && s.status === 'completed'
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => onMonthChange(subMonths(currentMonth, 1))}
          style={styles.navBtn}
        >
          <Ionicons name="chevron-back" size={20} color="#a1a1aa" />
        </Pressable>
        <Text style={styles.monthTitle}>
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </Text>
        <Pressable
          onPress={() => onMonthChange(addMonths(currentMonth, 1))}
          style={styles.navBtn}
        >
          <Ionicons name="chevron-forward" size={20} color="#a1a1aa" />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEK_DAYS.map((day) => (
          <Text key={day} style={styles.weekLabel}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {calendarDays.map((day, index) => {
          if (!day) {
            return (
              <View
                key={`empty-${index}`}
                style={[styles.cell, { width: cellSize, height: cellSize + 22 }]}
              />
            );
          }

          const daySessions = getSessionsForDay(day);
          const hasWorkout = daySessions.length > 0;
          const isCurrentDay = isToday(day);

          return (
            <View
              key={day.toISOString()}
                style={[
                styles.cell,
                { width: cellSize, height: cellSize + 22 },
                hasWorkout && styles.cellWorkout,
                isCurrentDay && styles.cellToday,
              ]}
            >
              <Text
                style={[
                  styles.dayNum,
                  hasWorkout && styles.dayNumWorkout,
                ]}
              >
                {format(day, 'd')}
              </Text>
              {hasWorkout && (
                <View style={styles.siglasWrap}>
                  {daySessions.slice(0, 2).map((s) => (
                    <Text key={s.id} style={styles.sigla} numberOfLines={1}>
                      {getSigla(s)}
                    </Text>
                  ))}
                  {daySessions.length > 2 && (
                    <Text style={styles.sigla}>+{daySessions.length - 2}</Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(24,24,27,0.5)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#27272a',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: '#71717a',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  cell: {
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(39,39,42,0.3)',
  },
  cellWorkout: {
    backgroundColor: 'rgba(234,179,8,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(234,179,8,0.3)',
  },
  cellToday: {
    borderWidth: 2,
    borderColor: '#eab308',
  },
  dayNum: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71717a',
  },
  dayNumWorkout: {
    color: '#eab308',
  },
  siglasWrap: {
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
  },
  sigla: {
    fontSize: 10,
    fontWeight: '700',
    color: '#eab308',
    letterSpacing: 0,
  },
});
