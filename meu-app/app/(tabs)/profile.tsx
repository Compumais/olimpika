import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  Modal,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { isThisMonth } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';
import { localApi } from '@/api/localApiClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const { user, logout, updateUser } = useAuth();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({ height: '', weight_kg: '', goal: '' });

  useEffect(() => {
    if (!user) return;
    setEditForm({
      height: (user as { height?: string }).height || '',
      weight_kg: (user as { weight_kg?: string }).weight_kg || '',
      goal: (user as { goal?: string }).goal || '',
    });
  }, [user]);

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', user?.email],
    queryFn: () => localApi.getWorkoutSessionsByUserEmail(user?.email || ''),
    enabled: !!user?.email,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { height?: string; weight_kg?: string; goal?: string }) => {
      updateUser(data);
      return data;
    },
    onSuccess: () => setShowEditDialog(false),
  });

  const completedSessions = (sessions as { status?: string }[]).filter(
    (s) => s.status === 'completed'
  );
  const thisMonthSessions = completedSessions.filter((s: { date?: string }) =>
    isThisMonth(new Date(s.date || ''))
  );
  const totalMinutes = completedSessions.reduce(
    (acc: number, s: { duration_minutes?: number }) => acc + (s.duration_minutes || 0),
    0
  );
  const totalHours = Math.floor(totalMinutes / 60);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const menuItems = [
    { icon: 'barbell-outline' as const, label: 'Gerenciar Treinos', route: '/manage-workouts' },
    { icon: 'calendar-outline' as const, label: 'Histórico Completo', route: '/(tabs)/history' },
    { icon: 'barbell-outline' as const, label: 'Biblioteca de Exercícios', route: '/exercise-library' },
  ];
  const u = user as { user_type?: string };
  if (u?.user_type === 'personal' || u?.user_type === 'admin') {
    menuItems.push({ icon: 'settings-outline' as const, label: 'Templates de Treino', route: '/workout-templates' });
  }

  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            {(user as { avatar_url?: string }).avatar_url ? (
              <Image
                source={{ uri: (user as { avatar_url?: string }).avatar_url }}
                style={styles.avatarImg}
              />
            ) : (
              <Ionicons name="person-outline" size={40} color="#a1a1aa" />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.full_name || 'Usuário'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            {(user as { goal?: string }).goal && (
              <Text style={styles.goal}>Meta: {(user as { goal?: string }).goal}</Text>
            )}
          </View>
        </View>
        <View style={styles.profileStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{completedSessions.length}</Text>
            <Text style={styles.statLabel}>Treinos</Text>
          </View>
          <View style={[styles.stat, styles.statBorder]}>
            <Text style={styles.statValue}>{totalHours}h</Text>
            <Text style={styles.statLabel}>Tempo Total</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{thisMonthSessions.length}</Text>
            <Text style={styles.statLabel}>Este Mês</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <Pressable onPress={() => setShowEditDialog(true)}>
            <Text style={styles.editLink}>Editar</Text>
          </Pressable>
        </View>
        <View style={styles.infoGrid}>
          <View>
            <Text style={styles.infoLabel}>Altura</Text>
            <Text style={styles.infoValue}>{(user as { height?: string }).height || '-'}</Text>
          </View>
          <View>
            <Text style={styles.infoLabel}>Peso</Text>
            <Text style={styles.infoValue}>
              {(user as { weight_kg?: string }).weight_kg
                ? `${(user as { weight_kg?: string }).weight_kg} kg`
                : '-'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <Pressable
            key={item.route}
            onPress={() => router.push(item.route as any)}
            style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
          >
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon} size={20} color="#eab308" />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#52525b" />
          </Pressable>
        ))}
      </View>

      <Button onPress={handleLogout} variant="destructive">
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Sair da Conta</Text>
      </Button>

      <Modal visible={showEditDialog} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowEditDialog(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <Input
              placeholder="Ex: 1.75m"
              value={editForm.height}
              onChangeText={(t) => setEditForm({ ...editForm, height: t })}
              style={styles.modalInput}
            />
            <Input
              placeholder="Ex: 75"
              value={editForm.weight_kg}
              onChangeText={(t) => setEditForm({ ...editForm, weight_kg: t })}
              keyboardType="decimal-pad"
              style={styles.modalInput}
            />
            <Input
              placeholder="Ex: Ganhar massa muscular"
              value={editForm.goal}
              onChangeText={(t) => setEditForm({ ...editForm, goal: t })}
              style={styles.modalInput}
            />
            <Button
              onPress={() => updateProfileMutation.mutate(editForm)}
              disabled={updateProfileMutation.isPending}
            >
              <Text style={styles.btnText}>
                {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Text>
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  content: { padding: 20, paddingBottom: 120 },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  profileCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 24,
    marginBottom: 24,
  },
  profileRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#27272a',
    borderWidth: 4,
    borderColor: '#eab308',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  profileEmail: { fontSize: 14, color: '#71717a', marginTop: 4 },
  goal: { fontSize: 14, color: '#eab308', marginTop: 4 },
  profileStats: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#27272a' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: '#71717a', marginTop: 4 },
  section: {
    backgroundColor: 'rgba(24,24,27,0.5)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    marginBottom: 24,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  editLink: { fontSize: 14, color: '#eab308' },
  infoGrid: { flexDirection: 'row', gap: 24 },
  infoLabel: { fontSize: 12, color: '#71717a' },
  infoValue: { fontSize: 16, fontWeight: '600', color: '#fff', marginTop: 4 },
  menu: {
    backgroundColor: 'rgba(24,24,27,0.5)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#27272a' },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: '#fff' },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#fff' },
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
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 16 },
  modalInput: { marginBottom: 16 },
  btnText: { fontSize: 16, fontWeight: '600', color: '#000' },
});
