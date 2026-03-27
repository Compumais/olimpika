import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { localApi } from '@/api/localApiClient';
import { useAuth } from '@/lib/AuthContext';
import CalendarHeatmap from '@/components/workout/CalendarHeatmap';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', user?.email],
    queryFn: () => localApi.getWorkoutSessionsByUserEmail(user?.email || ''),
    enabled: !!user?.email,
  });

  const completedSessions = (sessions as { status?: string }[])
    .filter((s) => s.status === 'completed')
    .sort(
      (a, b) =>
        new Date((b as { date?: string }).date || 0).getTime() -
        new Date((a as { date?: string }).date || 0).getTime()
    );

  const thisMonthSessions = completedSessions.filter((s) =>
    isThisMonth(new Date((s as { date?: string }).date || ''))
  );
  const totalMinutes = completedSessions.reduce(
    (acc, s) => acc + ((s as { duration_minutes?: number }).duration_minutes || 0),
    0
  );
  const totalHours = Math.floor(totalMinutes / 60);

  if (!user) return null;

  // Personal não vê histórico de treinos
  if (user.user_type === 'personal' || user.user_type === 'admin') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Histórico</Text>
        </View>
        <View style={styles.empty}>
          <Ionicons name="barbell-outline" size={48} color="#3f3f46" />
          <Text style={styles.emptyTitle}>
            Histórico de treinos é exibido apenas para alunos.
          </Text>
          <Text style={styles.emptySub}>
            Use a área de gerenciamento de treinos para acompanhar seus alunos.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Histórico</Text>
      </View>

      <Text style={styles.sub}>Seus treinos concluídos</Text>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Ionicons name="trophy" size={24} color="#eab308" />
          <Text style={styles.statValue}>{completedSessions.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="barbell-outline" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{thisMonthSessions.length}</Text>
          <Text style={styles.statLabel}>Este mês</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="time-outline" size={24} color="#a855f7" />
          <Text style={styles.statValue}>{totalHours}h</Text>
          <Text style={styles.statLabel}>Treinando</Text>
        </View>
      </View>

      {/* Calendário com siglas */}
      <View style={styles.calendarWrap}>
        <CalendarHeatmap
          sessions={completedSessions}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
      </View>

      {/* Lista de treinos */}
      <Text style={styles.listTitle}>Treinos Realizados</Text>

      {completedSessions.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="barbell-outline" size={48} color="#3f3f46" />
          <Text style={styles.emptyText}>Nenhum treino registrado</Text>
        </View>
      ) : (
        completedSessions.map(
          (session: {
            id: string;
            workout_name?: string;
            date?: string;
            duration_minutes?: number;
          }) => (
            <View key={session.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="barbell-outline" size={24} color="#eab308" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{session.workout_name}</Text>
                <Text style={styles.cardMeta}>
                  {format(new Date(session.date || ''), "EEEE, dd 'de' MMMM", {
                    locale: ptBR,
                  })}
                </Text>
              </View>
              {session.duration_minutes != null && (
                <Text style={styles.cardDuration}>
                  {session.duration_minutes} min
                </Text>
              )}
            </View>
          )
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  content: { padding: 20, paddingBottom: 120 },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  sub: { fontSize: 14, color: '#a1a1aa', marginBottom: 16 },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(24,24,27,0.5)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#71717a', marginTop: 4 },
  calendarWrap: { marginBottom: 24 },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: 'rgba(24,24,27,0.5)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  emptyTitle: { color: '#d4d4d8', fontWeight: '500', marginTop: 12 },
  emptySub: { color: '#71717a', fontSize: 14, marginTop: 8 },
  emptyText: { color: '#71717a', marginTop: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(24,24,27,0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    marginBottom: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(234,179,8,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  cardMeta: { fontSize: 14, color: '#71717a', marginTop: 4 },
  cardDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#eab308',
  },
});
