import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';
import { localApi } from '@/api/localApiClient';
import ExerciseCard from '@/components/workout/ExerciseCard';
import { Button } from '@/components/ui/Button';

export default function ActiveWorkoutScreen() {
  const { workout_id } = useLocalSearchParams<{ workout_id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [session, setSession] = useState<Record<string, unknown> | null>(null);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [weightOverrides, setWeightOverrides] = useState<Record<string, string>>({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: workout } = useQuery({
    queryKey: ['workout', workout_id],
    queryFn: () => (workout_id ? localApi.getWorkoutById(workout_id) : null),
    enabled: !!workout_id,
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises', workout_id],
    queryFn: () => localApi.getExercisesByWorkoutId(workout_id || ''),
    enabled: !!workout_id,
  });

  useEffect(() => {
    const timer = setInterval(() => setElapsedTime((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user?.email || !workout || session) return;
    localApi
      .createWorkoutSession({
        user_email: user.email,
        workout_id,
        workout_name: (workout as { name?: string }).name,
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: format(new Date(), 'HH:mm'),
        status: 'in_progress',
        exercises_completed: '[]',
      })
      .then(setSession);
  }, [user, workout, workout_id, session]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCompleteExercise = (exercise: { id: string }) => {
    setCompletedExercises((prev) =>
      prev.includes(exercise.id) ? prev.filter((id) => id !== exercise.id) : [...prev, exercise.id]
    );
  };

  const handleCompleteGroup = (groupExercises: { id: string }[]) => {
    const ids = groupExercises.map((e) => e.id);
    const allComplete = ids.every((id) => completedExercises.includes(id));
    setCompletedExercises((prev) =>
      allComplete ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]
    );
  };

  const handleWeightChange = (exerciseId: string, weight: string | null) => {
    setWeightOverrides((prev) => {
      const next = { ...prev };
      if (weight === null || weight === '') delete next[exerciseId];
      else next[exerciseId] = weight;
      return next;
    });
  };

  const isTemplateWorkout = workout_id?.startsWith?.('template:');
  const updateWeightMutation = useMutation({
    mutationFn: ({ id, weight }: { id: string; weight: string | null }) =>
      localApi.updateExercise(id, { weight: weight || null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises', workout_id] }),
  });

  const finishWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('Sessão ainda não foi criada. Aguarde um momento e tente novamente.');
      const exercisesData = completedExercises.map((exId) => {
        const ex = (exercises as { id: string; name?: string; sets?: number; weight?: string | number }[]).find((e) => e.id === exId);
        const weightUsed = weightOverrides[exId] ?? ex?.weight ?? null;
        return {
          exercise_id: exId,
          exercise_name: ex?.name,
          sets_completed: ex?.sets,
          weight_used: weightUsed,
        };
      });
      await localApi.updateWorkoutSession((session as { id: string }).id, {
        status: 'completed',
        end_time: format(new Date(), 'HH:mm'),
        duration_minutes: String(Math.round(elapsedTime / 60)),
        exercises_completed: JSON.stringify(exercisesData),
      });
    },
    onSuccess: () => {
      setShowFinishDialog(false);
      queryClient.invalidateQueries({ queryKey: ['sessions', user?.email] });
      router.replace('/(tabs)');
    },
    onError: (e: Error) => Alert.alert('Erro ao salvar', e?.message || 'Não foi possível salvar o treino.'),
  });

  const cancelWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (session)
        await localApi.updateWorkoutSession((session as { id: string }).id, { status: 'cancelled' });
    },
    onSuccess: () => router.replace('/(tabs)'),
  });

  const progress =
    (exercises as unknown[]).length > 0
      ? Math.round((completedExercises.length / (exercises as unknown[]).length) * 100)
      : 0;

  const hasMethodGroups = ['bi-set', 'tri-set', 'circuito'].includes(
    (workout as { training_method?: string })?.training_method || ''
  );
  const groupedExercises = hasMethodGroups
    ? (() => {
        const groups: Record<number, { id: string; name?: string; sets?: number; reps?: string; weight?: string; description?: string; image_url?: string; video_url?: string; rest_seconds?: number }[]> = {};
        (exercises as { method_group?: number }[]).forEach((ex) => {
          const g = ex.method_group ?? 0;
          if (!groups[g]) groups[g] = [];
          groups[g].push(ex);
        });
        return Object.keys(groups)
          .map(Number)
          .sort((a, b) => a - b)
          .map((gKey) => ({
            key: gKey,
            label: gKey === 0 ? null : `Grupo ${gKey}`,
            exercises: groups[gKey],
          }));
      })()
    : [{ key: 0, label: null, exercises }];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => setShowCancelDialog(true)} style={styles.iconBtn}>
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
          <View style={styles.timer}>
            <Ionicons name="time-outline" size={16} color="#eab308" />
            <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
          </View>
        </View>
        <Text style={styles.workoutName}>{(workout as { name?: string })?.name}</Text>
        <Text style={styles.progressText}>
          {completedExercises.length} de {(exercises as unknown[]).length} exercícios
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {groupedExercises.map((group, groupIndex) => {
          const isCombinedGroup = !!group.label;
          const groupIds = group.exercises.map((e) => e.id);
          const groupAllComplete =
            isCombinedGroup && groupIds.every((id) => completedExercises.includes(id));
          return (
            <View key={group.key} style={styles.group}>
              {group.label && (
                <View style={styles.groupLabel}>
                  <Text style={styles.groupLabelText}>
                    {group.label} — executar combinadamente
                  </Text>
                </View>
              )}
              {group.exercises.map((exercise, idx) => {
                const globalIndex = groupedExercises
                  .slice(0, groupIndex)
                  .reduce((acc, g) => acc + g.exercises.length, 0) + idx;
                return (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    index={globalIndex}
                    isCompleted={completedExercises.includes(exercise.id)}
                    onComplete={handleCompleteExercise}
                    hideCompleteButton={isCombinedGroup}
                    weightOverride={weightOverrides[exercise.id]}
                    onWeightChange={(id, w) => {
                      handleWeightChange(id, w);
                      if (!isTemplateWorkout) updateWeightMutation.mutate({ id, weight: w });
                    }}
                  />
                );
              })}
              {isCombinedGroup && (
                <Button
                  onPress={() => handleCompleteGroup(group.exercises)}
                  style={[
                    styles.groupBtn,
                    groupAllComplete && styles.groupBtnDone,
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={groupAllComplete ? '#eab308' : '#000'}
                  />
                  <Text
                    style={[
                      styles.groupBtnText,
                      groupAllComplete && styles.groupBtnTextDone,
                    ]}
                  >
                    {groupAllComplete ? 'Grupo concluído' : 'Concluir grupo'}
                  </Text>
                </Button>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          onPress={() => setShowFinishDialog(true)}
          disabled={completedExercises.length === 0}
          style={styles.finishBtn}
        >
          <Ionicons name="checkmark-circle" size={24} color="#000" />
          <Text style={styles.finishBtnText}>Finalizar Treino</Text>
        </Button>
      </View>

      <Modal visible={showFinishDialog} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowFinishDialog(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalIcon}>
              <Ionicons name="trophy" size={32} color="#eab308" />
            </View>
            <Text style={styles.modalTitle}>Finalizar Treino?</Text>
            <Text style={styles.modalSub}>
              Você completou {completedExercises.length} de {(exercises as unknown[]).length}{' '}
              exercícios em {formatTime(elapsedTime)}.
            </Text>
            <View style={styles.modalBtns}>
              <Button onPress={() => setShowFinishDialog(false)} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>Voltar</Text>
              </Button>
              <Button
                onPress={() => finishWorkoutMutation.mutate()}
                disabled={!session || finishWorkoutMutation.isPending}
                style={styles.modalBtn}
              >
                <Text style={styles.modalBtnText}>
                  {!session ? 'Aguarde...' : finishWorkoutMutation.isPending ? 'Salvando...' : 'Confirmar'}
                </Text>
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showCancelDialog} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCancelDialog(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalIcon, { backgroundColor: 'rgba(239,68,68,0.2)' }]}>
              <Ionicons name="close" size={32} color="#f87171" />
            </View>
            <Text style={styles.modalTitle}>Cancelar Treino?</Text>
            <Text style={styles.modalSub}>
              Seu progresso não será salvo. Tem certeza que deseja sair?
            </Text>
            <View style={styles.modalBtns}>
              <Button onPress={() => setShowCancelDialog(false)} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>Continuar treino</Text>
              </Button>
              <Button
                variant="destructive"
                onPress={() => cancelWorkoutMutation.mutate()}
                disabled={cancelWorkoutMutation.isPending}
                style={styles.modalBtn}
              >
                <Text style={styles.logoutText}>
                  {cancelWorkoutMutation.isPending ? 'Cancelando...' : 'Sair'}
                </Text>
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: {
    padding: 20,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    backgroundColor: 'rgba(9,9,11,0.95)',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  iconBtn: { padding: 8, borderRadius: 12, backgroundColor: '#27272a' },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#27272a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  timerText: { fontSize: 16, fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' },
  workoutName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  progressText: { fontSize: 14, color: '#a1a1aa', marginTop: 4 },
  progressBar: {
    marginTop: 12,
    height: 8,
    backgroundColor: '#27272a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#eab308' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  group: { marginBottom: 16 },
  groupLabel: {
    backgroundColor: 'rgba(234,179,8,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(234,179,8,0.3)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  groupLabelText: { fontSize: 14, fontWeight: '500', color: '#eab308' },
  groupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eab308',
  },
  groupBtnDone: { backgroundColor: 'rgba(234,179,8,0.2)' },
  groupBtnText: { fontSize: 16, fontWeight: '600', color: '#000' },
  groupBtnTextDone: { color: '#eab308' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#09090b',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#eab308',
  },
  finishBtnText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 24,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(234,179,8,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  modalSub: {
    fontSize: 14,
    color: '#a1a1aa',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1 },
  modalBtnText: { fontSize: 16, fontWeight: '600', color: '#000' },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
