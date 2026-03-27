import { View, Text, Pressable, ScrollView, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { localApi } from '@/api/localApiClient';
import { useAuth } from '@/lib/AuthContext';
import StatsCard from '@/components/workout/StatsCard';
import OlimpikaLogo from '@/components/OlimpikaLogo';

function PersonalHomeContent() {
  const { user } = useAuth();
  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts'],
    queryFn: () => localApi.getWorkouts(),
  });
  const { data: exercises = [] } = useQuery({
    queryKey: ['exercise-library'],
    queryFn: () => localApi.getTemplateExercises(),
  });
  const { data: workoutTemplates = [] } = useQuery({
    queryKey: ['workout-templates'],
    queryFn: () => localApi.getWorkoutTemplates(),
  });
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => localApi.getStudents({}),
    enabled: !!user,
  });
  const today = new Date().toISOString().split('T')[0];
  const myStudents = (students as { personal_trainer_email?: string }[]).filter(
    (s) => !user?.email || s.personal_trainer_email === user.email
  );
  const studentsWithExpiredWorkouts = myStudents.filter(
    (s: { next_expires_at?: string }) => s.next_expires_at && s.next_expires_at < today
  );
  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };
  const adoptedCount = (students as { personal_trainer_email?: string }[]).filter(
    (s) => s.personal_trainer_email === user?.email
  ).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <OlimpikaLogo size="sm" />
          <Text style={styles.name}>
            Olá, {user?.full_name?.split(' ')[0] || 'Personal'}! 💪
          </Text>
          <Text style={styles.sub}>Área do Personal Trainer</Text>
        </View>
        <Pressable onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="settings-outline" size={24} color="#a1a1aa" />
        </Pressable>
      </View>

      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Ionicons name="person-outline" size={24} color="#eab308" />
          <Text style={styles.statValue}>{adoptedCount}</Text>
          <Text style={styles.statLabel}>Alunos</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="barbell-outline" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{workouts.length}</Text>
          <Text style={styles.statLabel}>Treinos</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="trending-up-outline" size={24} color="#22c55e" />
          <Text style={styles.statValue}>{exercises.length}</Text>
          <Text style={styles.statLabel}>Exercícios</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="layers-outline" size={24} color="#a855f7" />
          <Text style={styles.statValue}>{workoutTemplates.length}</Text>
          <Text style={styles.statLabel}>Templates</Text>
        </View>
      </View>

      {studentsWithExpiredWorkouts.length > 0 && (
        <View style={styles.expired}>
          <Text style={styles.expiredTitle}>
            <Ionicons name="warning-outline" size={20} color="#f87171" /> Treinos vencidos
          </Text>
          <Text style={styles.expiredSub}>
            Alunos com treinos que precisam de renovação
          </Text>
          {studentsWithExpiredWorkouts.map((student: { id: string; name?: string; next_expires_at?: string }) => (
            <Pressable
              key={student.id}
              onPress={() =>
                router.push({
                  pathname: '/student-workouts',
                  params: { student_id: student.id, student_name: student.name || '' },
                })
              }
              style={styles.expiredCard}
            >
              <View style={styles.expiredRow}>
                <View style={styles.expiredIcon}>
                  <Ionicons name="person-outline" size={20} color="#f87171" />
                </View>
                <View>
                  <Text style={styles.expiredName}>{student.name}</Text>
                  <Text style={styles.expiredDate}>
                    Venceu em {formatDate(student.next_expires_at)}
                  </Text>
                </View>
                <Text style={styles.expiredLink}>Gerenciar →</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Ações Rápidas</Text>
      <Pressable
        onPress={() => router.push('/manage-students')}
        style={[styles.actionCard, styles.actionYellow]}
      >
        <View style={styles.actionRow}>
          <View style={styles.actionIcon}>
            <Ionicons name="people-outline" size={24} color="#fff" />
          </View>
          <View>
            <Text style={[styles.actionTitle, styles.actionTitleYellow]}>Gerenciar Alunos</Text>
            <Text style={[styles.actionSub, styles.actionSubYellow]}>Adicionar e gerenciar alunos</Text>
          </View>
          <Ionicons name="add" size={24} color="#000" />
        </View>
      </Pressable>
      <Pressable
        onPress={() => router.push('/exercise-library')}
        style={styles.actionCard}
      >
        <View style={styles.actionRow}>
          <View style={[styles.actionIcon, styles.actionIconDark]}>
            <Ionicons name="barbell-outline" size={24} color="#eab308" />
          </View>
          <View>
            <Text style={styles.actionTitle}>Biblioteca de Exercícios</Text>
            <Text style={styles.actionSub}>{exercises.length} exercícios cadastrados</Text>
          </View>
        </View>
      </Pressable>
      <Pressable
        onPress={() => router.push('/workout-templates')}
        style={styles.actionCard}
      >
        <View style={styles.actionRow}>
          <View style={[styles.actionIcon, styles.actionIconDark]}>
            <Ionicons name="layers-outline" size={24} color="#eab308" />
          </View>
          <View>
            <Text style={styles.actionTitle}>Templates de Treino</Text>
            <Text style={styles.actionSub}>
              {workoutTemplates.length} templates compartilhados
            </Text>
          </View>
        </View>
      </Pressable>
      <Pressable
        onPress={() => router.push('/list-users')}
        style={styles.actionCard}
      >
        <View style={styles.actionRow}>
          <View style={[styles.actionIcon, styles.actionIconDark]}>
            <Ionicons name="people-outline" size={24} color="#eab308" />
          </View>
          <View>
            <Text style={styles.actionTitle}>Usuários cadastrados</Text>
            <Text style={styles.actionSub}>Listar todos os usuários</Text>
          </View>
        </View>
      </Pressable>

      <Text style={styles.sectionTitle}>Treinos Recentes</Text>
      {workouts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="barbell-outline" size={48} color="#3f3f46" />
          <Text style={styles.emptyText}>Nenhum treino criado ainda</Text>
          <Pressable
            onPress={() => router.push('/manage-workouts')}
            style={styles.createBtn}
          >
            <Ionicons name="add" size={16} color="#000" />
            <Text style={styles.createBtnText}>Criar Primeiro Treino</Text>
          </Pressable>
        </View>
      ) : (
        (workouts as { id: string; name?: string; short_name?: string }[])
          .slice(0, 3)
          .map((workout) => (
            <Pressable
              key={workout.id}
              onPress={() =>
                router.push({
                  pathname: '/manage-exercises',
                  params: { workout_id: workout.id },
                })
              }
              style={styles.workoutCard}
            >
              <View>
                <Text style={styles.workoutName}>{workout.name}</Text>
                <Text style={styles.workoutShort}>{workout.short_name}</Text>
              </View>
              <Text style={styles.workoutBadge}>{workout.short_name}</Text>
            </Pressable>
          ))
      )}
    </ScrollView>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();


  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', user?.email],
    queryFn: () => localApi.getWorkoutSessionsByUserEmail(user?.email || ''),
    enabled: !!user?.email,
  });

  const completedSessions = sessions.filter(
    (s: { status?: string }) => s.status === 'completed'
  );
  const thisMonthSessions = completedSessions.filter((s: { date?: string }) =>
    isThisMonth(new Date(s.date || ''))
  );

  const calculateStreak = () => {
    if (completedSessions.length === 0) return 0;
    const sortedDates = [
      ...new Set(
        completedSessions.map((s: { date?: string }) =>
          format(new Date(s.date || ''), 'yyyy-MM-dd')
        )
      ),
    ].sort()
      .reverse();
    let streak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) return 0;
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = format(
        new Date(Date.now() - i * 86400000),
        'yyyy-MM-dd'
      );
      if (sortedDates.includes(expectedDate)) streak++;
      else if (i === 0 && sortedDates.includes(yesterday)) continue;
      else break;
    }
    return streak;
  };

  const streak = calculateStreak();

  if (!user) return null;

  if (user.user_type === 'personal' || user.user_type === 'admin') {
    return <PersonalHomeContent />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <OlimpikaLogo size="sm" />
          <Text style={styles.greeting}>Olá,</Text>
          <Text style={styles.name}>{user?.full_name || 'Atleta'}</Text>
        </View>
        <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.avatar}>
          {(user as { avatar_url?: string }).avatar_url ? (
            <Image
              source={{ uri: (user as { avatar_url?: string }).avatar_url }}
              style={styles.avatarImg}
            />
          ) : (
            <Ionicons name="person-outline" size={24} color="#a1a1aa" />
          )}
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push('/select-workout' as any)}
        style={styles.cta}
      >
        <View>
          <Text style={styles.ctaTitle}>Iniciar Treino</Text>
          <Text style={styles.ctaSub}>
            {thisMonthSessions.length} treinos este mês
          </Text>
        </View>
        <View style={styles.ctaIcon}>
          <Ionicons name="play" size={28} color="#000" />
        </View>
      </Pressable>

      <View style={styles.stats}>
        <View style={styles.statsCardWrap}>
          <StatsCard
            icon="flame"
            label="Sequência"
            value={`${streak} dias`}
            color="orange"
          />
        </View>
        <View style={styles.statsCardWrap}>
          <StatsCard
            icon="trophy"
            label="Total"
            value={completedSessions.length}
            color="amber"
          />
        </View>
        <View style={styles.statsCardWrap}>
          <StatsCard
            icon="calendar"
            label="Este mês"
            value={thisMonthSessions.length}
            color="yellow"
          />
        </View>
        <View style={styles.statsCardWrap}>
          <StatsCard
            icon="trendingUp"
            label="Média/semana"
            value={(thisMonthSessions.length / 4).toFixed(1)}
            color="yellow"
          />
        </View>
      </View>

      {user.user_type === 'aluno' && (
        <View style={styles.activity}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Atividade Recente</Text>
            <Pressable onPress={() => router.push('/(tabs)/history')}>
              <Text style={styles.activityLink}>Ver tudo</Text>
            </Pressable>
          </View>
          {completedSessions.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="barbell-outline" size={48} color="#3f3f46" />
              <Text style={styles.emptyText}>Nenhum treino registrado</Text>
              <Text style={styles.emptySub}>Comece seu primeiro treino hoje!</Text>
            </View>
          ) : (
            completedSessions.slice(0, 5).map((session: { id: string; workout_name?: string; date?: string; duration_minutes?: number }) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionIcon}>
                  <Ionicons name="barbell-outline" size={24} color="#eab308" />
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionName}>{session.workout_name}</Text>
                  <Text style={styles.sessionMeta}>
                    {format(new Date(session.date || ''), "dd 'de' MMMM", { locale: ptBR })}
                    {session.duration_minutes && ` • ${session.duration_minutes} min`}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  content: { padding: 20, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  greeting: { fontSize: 14, color: '#a1a1aa' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#27272a',
    borderWidth: 2,
    borderColor: '#eab308',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eab308',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  ctaTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  ctaSub: { fontSize: 14, color: 'rgba(0,0,0,0.8)' },
  ctaIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 24,
  },
  statsCardWrap: {
    width: '100%',
  },
  activity: { marginBottom: 24 },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  activityLink: { fontSize: 14, color: '#eab308', fontWeight: '500' },
  empty: {
    backgroundColor: 'rgba(24,24,27,0.5)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 32,
    alignItems: 'center',
  },
  emptyText: { color: '#71717a', marginTop: 12 },
  emptySub: { color: '#52525b', fontSize: 14, marginTop: 4 },
  sessionCard: {
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
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(234,179,8,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: { flex: 1 },
  sessionName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  sessionMeta: { fontSize: 14, color: '#71717a', marginTop: 4 },
  sub: { fontSize: 14, color: '#71717a' },
  statBox: {
    flex: 1,
    minWidth: 80,
    backgroundColor: 'rgba(24,24,27,0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: '#71717a', marginTop: 4 },
  expired: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  expiredTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  expiredSub: { fontSize: 14, color: '#71717a', marginBottom: 12 },
  expiredCard: {
    backgroundColor: 'rgba(24,24,27,0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(185,28,28,0.5)',
    padding: 16,
    marginBottom: 8,
  },
  expiredRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  expiredIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiredName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  expiredDate: { fontSize: 12, color: '#71717a', marginTop: 2 },
  expiredLink: { fontSize: 12, color: '#f87171', fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 },
  actionCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    marginBottom: 12,
  },
  actionYellow: { backgroundColor: '#eab308' },
  actionTitleYellow: { color: '#000' },
  actionSubYellow: { color: 'rgba(0,0,0,0.7)' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconDark: { backgroundColor: '#27272a' },
  actionTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  actionSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(24,24,27,0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    marginBottom: 12,
  },
  workoutName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  workoutShort: { fontSize: 14, color: '#71717a', marginTop: 2 },
  workoutBadge: { fontSize: 20, fontWeight: 'bold', color: '#eab308' },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eab308',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  createBtnText: { fontSize: 16, fontWeight: '600', color: '#000' },
});
