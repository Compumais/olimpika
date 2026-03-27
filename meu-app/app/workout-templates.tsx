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
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { localApi } from '@/api/localApiClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';

type Template = {
  id: string;
  name?: string;
  short_name?: string;
  description?: string;
  estimated_duration?: string;
  muscle_groups?: string;
  color?: string;
  training_method?: string;
};

const COLORS = [
  ['#ca8a04', '#854d0e'],
  ['#d97706', '#9a3412'],
  ['#ea580c', '#c2410c'],
  ['#eab308', '#a16207'],
  ['#f59e0b', '#b45309'],
];

const TRAINING_METHODS = [
  { value: '', label: 'Tradicional' },
  { value: 'bi-set', label: 'Bi-set' },
  { value: 'tri-set', label: 'Tri-set' },
  { value: 'circuito', label: 'Circuito' },
];

export default function WorkoutTemplatesScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    description: '',
    estimated_duration: '',
    muscle_groups: '',
    training_method: '',
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['workout-templates'],
    queryFn: () => localApi.getWorkoutTemplates(),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      localApi.createWorkoutTemplate(data, user!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-templates'] });
      handleCloseDialog();
    },
    onError: (err: Error) => setErrorMessage(err?.message ?? 'Erro ao criar template.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      localApi.updateWorkoutTemplate(id, data, user!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-templates'] });
      handleCloseDialog();
    },
    onError: (err: Error) => setErrorMessage(err?.message ?? 'Erro ao atualizar.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => localApi.deleteWorkoutTemplate(id, user!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout-templates'] }),
    onError: (err: Error) => setErrorMessage(err?.message ?? 'Erro ao excluir.'),
  });

  const handleOpenDialog = (template?: Template | null) => {
    setErrorMessage('');
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name || '',
        short_name: template.short_name || '',
        description: template.description || '',
        estimated_duration: template.estimated_duration || '',
        muscle_groups: template.muscle_groups || '',
        training_method: template.training_method || '',
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        short_name: '',
        description: '',
        estimated_duration: '',
        muscle_groups: '',
        training_method: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setErrorMessage('');
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    const payload = {
      ...formData,
      muscle_groups: formData.muscle_groups || undefined,
      estimated_duration: formData.estimated_duration
        ? String(formData.estimated_duration)
        : null,
    };
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isAdmin = user?.user_type === 'admin';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.title}>Templates de Treino</Text>
        <Pressable onPress={() => handleOpenDialog()} style={styles.addBtn}>
          <Ionicons name="add" size={20} color="#000" />
          <Text style={styles.addBtnText}>Novo</Text>
        </Pressable>
      </View>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.skeletonWrap}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={96} style={styles.skeleton} />
          ))}
        </View>
      ) : (templates as Template[]).length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="barbell-outline" size={40} color="#52525b" />
          </View>
          <Text style={styles.emptyTitle}>Nenhum template cadastrado</Text>
          <Text style={styles.emptySub}>
            Personais podem criar templates compartilhados.
          </Text>
          <Pressable onPress={() => handleOpenDialog()} style={styles.addBtn}>
            <Ionicons name="add" size={18} color="#000" />
            <Text style={styles.addBtnText}>Criar primeiro template</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {(templates as Template[]).map((t, index) => (
            <View
              key={t.id}
              style={[
                styles.card,
                { backgroundColor: COLORS[index % COLORS.length][0] },
              ]}
            >
              <View style={styles.cardMain}>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>
                    {t.short_name || 'TMP'}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardName}>{t.name}</Text>
                    {t.training_method ? (
                      <View style={styles.methodBadge}>
                        <Text style={styles.methodBadgeText}>
                          {t.training_method === 'bi-set'
                            ? 'Bi-set'
                            : t.training_method === 'tri-set'
                              ? 'Tri-set'
                              : t.training_method === 'circuito'
                                ? 'Circuito'
                                : t.training_method}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.cardMeta}>
                    {t.estimated_duration ? (
                      <View style={styles.cardMetaItem}>
                        <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.cardMetaText}>
                          {t.estimated_duration} min
                        </Text>
                      </View>
                    ) : null}
                    {t.muscle_groups ? (
                      <Text style={styles.cardMetaText}>
                        {t.muscle_groups.split(',').filter(Boolean).length} grupos
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/template-exercises',
                      params: { template_id: t.id },
                    })
                  }
                  style={styles.cardActionBtn}
                >
                  <Ionicons name="barbell-outline" size={18} color="#fff" />
                </Pressable>
                <Pressable
                  onPress={() => handleOpenDialog(t)}
                  style={styles.cardActionBtn}
                >
                  <Ionicons name="pencil" size={18} color="#fff" />
                </Pressable>
                {isAdmin && (
                  <Pressable
                    onPress={() => deleteMutation.mutate(t.id)}
                    style={[styles.cardActionBtn, styles.cardActionBtnDanger]}
                  >
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <Modal visible={dialogOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={handleCloseDialog}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </Text>
            <Input
              placeholder="Nome *"
              value={formData.name}
              onChangeText={(t) => setFormData({ ...formData, name: t })}
              style={styles.modalInput}
            />
            <Input
              placeholder="Sigla"
              value={formData.short_name}
              onChangeText={(t) => setFormData({ ...formData, short_name: t })}
              style={styles.modalInput}
            />
            <Input
              placeholder="Descrição"
              value={formData.description}
              onChangeText={(t) => setFormData({ ...formData, description: t })}
              style={styles.modalInput}
            />
            <Input
              placeholder="Grupos musculares (ex: Peito, Tríceps)"
              value={formData.muscle_groups}
              onChangeText={(t) => setFormData({ ...formData, muscle_groups: t })}
              style={styles.modalInput}
            />
            <Input
              placeholder="Duração estimada (min)"
              value={formData.estimated_duration}
              onChangeText={(t) =>
                setFormData({ ...formData, estimated_duration: t })
              }
              keyboardType="numeric"
              style={styles.modalInput}
            />
            <Text style={styles.modalLabel}>Método de treino</Text>
            <View style={styles.methodOptions}>
              {TRAINING_METHODS.map((m) => (
                <Pressable
                  key={m.value || 'tradicional'}
                  onPress={() =>
                    setFormData({ ...formData, training_method: m.value })
                  }
                  style={[
                    styles.methodOption,
                    formData.training_method === m.value &&
                      styles.methodOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.methodOptionText,
                      formData.training_method === m.value &&
                        styles.methodOptionTextActive,
                    ]}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              ))}
            </View>
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
  title: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#fff' },
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
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#71717a', marginBottom: 20 },
  list: { gap: 12 },
  card: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgeText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
  },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  methodBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodBadgeText: { fontSize: 11, color: '#fff', fontWeight: '500' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  cardActions: { flexDirection: 'row', gap: 4 },
  cardActionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  cardActionBtnDanger: { backgroundColor: 'rgba(239,68,68,0.5)' },
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
  modalLabel: { fontSize: 14, color: '#a1a1aa', marginBottom: 8 },
  methodOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  methodOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  methodOptionActive: {
    borderColor: '#eab308',
    backgroundColor: 'rgba(234,179,8,0.1)',
  },
  methodOptionText: { fontSize: 14, color: '#a1a1aa' },
  methodOptionTextActive: { color: '#eab308', fontWeight: '600' },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtnText: { fontSize: 16, fontWeight: '600', color: '#eab308' },
  modalBtnTextBlack: { fontSize: 16, fontWeight: '600', color: '#000' },
});
