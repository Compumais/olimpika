import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { localApi } from '@/api/localApiClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { parseWeightForInput, formatWeightDisplay } from '@/utils';

type Exercise = {
  id: string;
  name?: string;
  sets?: string | number;
  reps?: string;
  weight?: string | number | null;
  rest_seconds?: string | number;
  order?: string | number;
};

export default function TemplateExercisesScreen() {
  const { template_id } = useLocalSearchParams<{ template_id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    sets: '',
    reps: '',
    weight: '',
    rest_seconds: '',
    order: '',
  });

  const { data: template } = useQuery({
    queryKey: ['workout-template', template_id],
    queryFn: async () => {
      const list = await localApi.getWorkoutTemplates();
      return (list as { id: string }[]).find((t) => t.id === template_id);
    },
    enabled: !!template_id,
  });

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['template-exercises', template_id],
    queryFn: () => localApi.getTemplateExercisesByTemplateId(template_id || ''),
    enabled: !!template_id,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      localApi.createTemplateExercise(template_id!, data, user!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-exercises', template_id] });
      handleCloseDialog();
    },
    onError: (err: Error) => setErrorMessage(err?.message ?? 'Erro ao criar exercício.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      localApi.updateTemplateExercise(template_id!, id, data, user!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-exercises', template_id] });
      handleCloseDialog();
    },
    onError: (err: Error) => setErrorMessage(err?.message ?? 'Erro ao atualizar.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      localApi.deleteTemplateExercise(template_id!, id, user!),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['template-exercises', template_id] }),
  });

  const handleOpenDialog = (exercise?: Exercise | null) => {
    setErrorMessage('');
    if (exercise) {
      setEditingExercise(exercise);
      setFormData({
        name: exercise.name || '',
        sets: String(exercise.sets ?? ''),
        reps: String(exercise.reps ?? ''),
        weight: parseWeightForInput(exercise.weight),
        rest_seconds: String(exercise.rest_seconds ?? ''),
        order: String(exercise.order ?? ''),
      });
    } else {
      setEditingExercise(null);
      setFormData({
        name: '',
        sets: '',
        reps: '',
        weight: '',
        rest_seconds: '',
        order: String((exercises as unknown[]).length + 1),
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingExercise(null);
    setErrorMessage('');
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    const payload: Record<string, unknown> = {
      name: formData.name.trim(),
      sets: formData.sets || null,
      reps: formData.reps || null,
      weight: formData.weight ? formData.weight.replace(',', '.') : null,
      rest_seconds: formData.rest_seconds || null,
      order: formData.order || null,
    };
    if (editingExercise) {
      updateMutation.mutate({ id: editingExercise.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <View style={styles.headerRight}>
          <Text style={styles.title}>
            {(template as { name?: string })?.name || 'Exercícios'}
          </Text>
          <Text style={styles.subTitle}>
            {(exercises as unknown[]).length} exercícios
          </Text>
        </View>
        <Pressable onPress={() => handleOpenDialog()} style={styles.addBtn}>
          <Ionicons name="add" size={20} color="#000" />
          <Text style={styles.addBtnText}>Adicionar</Text>
        </Pressable>
      </View>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.skeletonWrap}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={72} style={styles.skeleton} />
          ))}
        </View>
      ) : (exercises as Exercise[]).length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="barbell-outline" size={48} color="#3f3f46" />
          <Text style={styles.emptyTitle}>Nenhum exercício</Text>
          <Text style={styles.emptySub}>Adicione exercícios a este template</Text>
          <Pressable onPress={() => handleOpenDialog()} style={styles.addBtn}>
            <Ionicons name="add" size={18} color="#000" />
            <Text style={styles.addBtnText}>Adicionar exercício</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {(exercises as Exercise[]).map((ex, idx) => (
            <View key={ex.id} style={styles.card}>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>{idx + 1}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{ex.name}</Text>
                <Text style={styles.cardMeta}>
                  {ex.sets} × {ex.reps}
                  {ex.weight != null && ex.weight !== ''
                    ? ` • ${formatWeightDisplay(ex.weight)}`
                    : ''}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  onPress={() => handleOpenDialog(ex)}
                  style={styles.cardActionBtn}
                >
                  <Ionicons name="pencil" size={18} color="#eab308" />
                </Pressable>
                <Pressable
                  onPress={() => deleteMutation.mutate(ex.id)}
                  style={[styles.cardActionBtn, styles.cardActionBtnDanger]}
                >
                  <Ionicons name="trash-outline" size={18} color="#f87171" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <Modal visible={dialogOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={handleCloseDialog}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {editingExercise ? 'Editar Exercício' : 'Novo Exercício'}
            </Text>
            <Input
              placeholder="Nome *"
              value={formData.name}
              onChangeText={(t) => setFormData({ ...formData, name: t })}
              style={styles.modalInput}
            />
            <Input
              placeholder="Séries"
              value={formData.sets}
              onChangeText={(t) => setFormData({ ...formData, sets: t })}
              keyboardType="numeric"
              style={styles.modalInput}
            />
            <Input
              placeholder="Repetições"
              value={formData.reps}
              onChangeText={(t) => setFormData({ ...formData, reps: t })}
              style={styles.modalInput}
            />
            <Input
              placeholder="Carga (kg)"
              value={formData.weight}
              onChangeText={(t) => setFormData({ ...formData, weight: t })}
              keyboardType="decimal-pad"
              style={styles.modalInput}
            />
            <Input
              placeholder="Descanso (seg)"
              value={formData.rest_seconds}
              onChangeText={(t) => setFormData({ ...formData, rest_seconds: t })}
              keyboardType="numeric"
              style={styles.modalInput}
            />
            <Input
              placeholder="Ordem"
              value={formData.order}
              onChangeText={(t) => setFormData({ ...formData, order: t })}
              keyboardType="numeric"
              style={styles.modalInput}
            />
            <View style={styles.modalBtns}>
              <Button onPress={handleCloseDialog} variant="ghost">
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </Button>
              <Button
                onPress={handleSubmit}
                disabled={
                  !formData.name.trim() ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.modalBtnTextBlack}>Salvar</Text>
                )}
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  content: { padding: 20, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: '#27272a' },
  headerRight: { flex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  subTitle: { fontSize: 12, color: '#71717a' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eab308',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: { fontSize: 14, fontWeight: '600', color: '#000' },
  errorBox: {
    backgroundColor: 'rgba(185,28,28,0.2)',
    borderWidth: 1,
    borderColor: '#991b1b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#f87171', fontSize: 14 },
  skeletonWrap: { gap: 12 },
  skeleton: { marginBottom: 12 },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#71717a', marginBottom: 20 },
  list: { gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(24,24,27,0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 14,
  },
  cardBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(234,179,8,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#eab308',
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  cardMeta: { fontSize: 13, color: '#71717a', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 4 },
  cardActionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#27272a',
  },
  cardActionBtnDanger: { backgroundColor: 'rgba(239,68,68,0.2)' },
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  modalInput: { marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtnText: { fontSize: 16, fontWeight: '600', color: '#eab308' },
  modalBtnTextBlack: { fontSize: 16, fontWeight: '600', color: '#000' },
});
