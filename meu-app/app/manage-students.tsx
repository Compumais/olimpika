import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
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

type Student = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  goal?: string;
  personal_trainer_email?: string;
  workout_assigned_by?: string;
  next_expires_at?: string;
};

function formatDate(iso?: string) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function ManageStudentsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    goal: '',
    notes: '',
  });
  const [createError, setCreateError] = useState('');
  const [adoptError, setAdoptError] = useState('');

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => localApi.getStudents({}),
    enabled: !!user,
  });

  const adoptMutation = useMutation({
    mutationFn: (studentId: string) =>
      localApi.updateStudent(studentId, {
        personal_trainer_email: user?.email ?? '',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setAdoptError('');
    },
    onError: (err: Error) => setAdoptError(err?.message ?? 'Erro ao adotar aluno.'),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      localApi.createStudent({
        ...data,
        personal_trainer_email: user?.email ?? '',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setCreateError('');
      setDialogOpen(false);
      setFormData({ name: '', email: '', phone: '', goal: '', notes: '' });
    },
    onError: (err: Error) => setCreateError(err?.message ?? 'Erro ao cadastrar.'),
  });

  const filteredStudents = (students as Student[]).filter((s) =>
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = () => {
    const name = (formData.name || '').trim();
    const email = (formData.email || '').trim().toLowerCase();
    if (!name || !email) return;
    createMutation.mutate({ ...formData, name, email });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <View style={styles.headerRight}>
          <Text style={styles.title}>Alunos</Text>
          <Text style={styles.subTitle}>
            {(students as unknown[]).length} cadastrado(s)
          </Text>
        </View>
        <Pressable
          onPress={() => {
            setFormData({ name: '', email: '', phone: '', goal: '', notes: '' });
            setCreateError('');
            setDialogOpen(true);
          }}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={20} color="#000" />
          <Text style={styles.addBtnText}>Cadastrar</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color="#71717a" style={styles.searchIcon} />
        <TextInput
          placeholder="Buscar aluno..."
          placeholderTextColor="#71717a"
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.searchInput}
        />
      </View>

      {adoptError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{adoptError}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.skeletonWrap}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={88} style={styles.skeleton} />
          ))}
        </View>
      ) : filteredStudents.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="person-outline" size={64} color="#3f3f46" />
          <Text style={styles.emptyTitle}>
            {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
          </Text>
          <Text style={styles.emptySub}>
            {searchTerm
              ? 'Tente buscar por outro nome'
              : 'Cadastre um novo aluno para começar'}
          </Text>
          {!searchTerm && (
            <Pressable
              onPress={() => setDialogOpen(true)}
              style={styles.addBtn}
            >
              <Ionicons name="add" size={20} color="#000" />
              <Text style={styles.addBtnText}>Cadastrar aluno</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={styles.list}>
          {filteredStudents.map((student) => {
            const isAdoptedByMe = student.personal_trainer_email === user?.email;
            return (
              <Pressable
                key={student.id}
                onPress={() =>
                  isAdoptedByMe &&
                  router.push({
                    pathname: '/student-workouts',
                    params: {
                      student_id: student.id,
                      student_name: student.name || '',
                    },
                  })
                }
                style={[
                  styles.card,
                  isAdoptedByMe && styles.cardAdopted,
                ]}
              >
                <View style={styles.cardAvatar}>
                  <Ionicons name="person" size={28} color="#eab308" />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{student.name}</Text>
                  {student.goal ? (
                    <Text style={styles.cardGoal}>{student.goal}</Text>
                  ) : null}
                  <View style={styles.cardMeta}>
                    {student.email ? <Text style={styles.cardMetaText}>{student.email}</Text> : null}
                    {student.phone ? (
                      <Text style={styles.cardMetaText}> • {student.phone}</Text>
                    ) : null}
                  </View>
                  {(student.workout_assigned_by || student.next_expires_at) && isAdoptedByMe && (
                    <View style={styles.cardExtra}>
                      {student.workout_assigned_by && (
                        <Text style={styles.cardExtraText}>
                          Personal: {student.workout_assigned_by}
                        </Text>
                      )}
                      {student.next_expires_at && (
                        <Text style={styles.cardExtraText}>
                          Renovar: {formatDate(student.next_expires_at)}
                        </Text>
                      )}
                    </View>
                  )}
                  {!isAdoptedByMe && student.personal_trainer_email ? (
                    <Text style={styles.cardExtraText}>Adotado por outro personal</Text>
                  ) : null}
                </View>
                <View style={styles.cardAction}>
                  {isAdoptedByMe ? (
                    <>
                      <Ionicons name="barbell-outline" size={20} color="#71717a" />
                      <Text style={styles.cardActionLabel}>Treinos</Text>
                      <Ionicons name="chevron-forward" size={20} color="#52525b" />
                    </>
                  ) : (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        adoptMutation.mutate(student.id);
                      }}
                      disabled={adoptMutation.isPending}
                      style={styles.adoptBtn}
                    >
                      <Ionicons name="person-add" size={16} color="#000" />
                      <Text style={styles.adoptBtnText}>
                        {adoptMutation.isPending ? 'Adotando...' : 'Adotar'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Modal visible={dialogOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setDialogOpen(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Adicionar Novo Aluno</Text>
            <Input
              placeholder="Nome do Aluno *"
              value={formData.name}
              onChangeText={(t) => setFormData({ ...formData, name: t })}
              style={styles.modalInput}
            />
            <Input
              placeholder="Email *"
              value={formData.email}
              onChangeText={(t) => setFormData({ ...formData, email: t })}
              keyboardType="email-address"
              style={styles.modalInput}
            />
            <Input
              placeholder="Telefone"
              value={formData.phone}
              onChangeText={(t) => setFormData({ ...formData, phone: t })}
              keyboardType="phone-pad"
              style={styles.modalInput}
            />
            <Input
              placeholder="Objetivo"
              value={formData.goal}
              onChangeText={(t) => setFormData({ ...formData, goal: t })}
              style={styles.modalInput}
            />
            {createError ? (
              <Text style={styles.errorText}>{createError}</Text>
            ) : null}
            <View style={styles.modalBtns}>
              <Button onPress={() => setDialogOpen(false)} variant="ghost">
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </Button>
              <Button
                onPress={handleSubmit}
                disabled={
                  !formData.name?.trim() ||
                  !formData.email?.trim() ||
                  createMutation.isPending
                }
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.modalBtnTextBlack}>Cadastrar</Text>
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
    marginBottom: 20,
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 16,
  },
  searchIcon: { marginLeft: 12 },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#fff',
  },
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
  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(24,24,27,0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
  },
  cardAdopted: { borderColor: '#3f3f46' },
  cardAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(234,179,8,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(234,179,8,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  cardGoal: { fontSize: 14, color: '#eab308', marginTop: 2 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  cardMetaText: { fontSize: 12, color: '#71717a' },
  cardExtra: { marginTop: 6 },
  cardExtraText: { fontSize: 11, color: '#a1a1aa' },
  cardAction: { alignItems: 'center' },
  cardActionLabel: { fontSize: 11, color: '#71717a', marginTop: 2 },
  adoptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eab308',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adoptBtnText: { fontSize: 13, fontWeight: '600', color: '#000' },
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
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtnText: { fontSize: 16, fontWeight: '600', color: '#eab308' },
  modalBtnTextBlack: { fontSize: 16, fontWeight: '600', color: '#000' },
});
