import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  User, 
  Settings, 
  Trophy, 
  Calendar, 
  Clock,
  LogOut,
  ChevronRight,
  Dumbbell,
  Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isThisMonth, format } from "date-fns";
import { useAuth } from "@/lib/AuthContext";
import { localApi } from "@/api/localApiClient";

export default function Profile() {
  const queryClient = useQueryClient();
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (!user) return;
    setEditForm({
      height: user.height || '',
      weight_kg: user.weight_kg || '',
      goal: user.goal || ''
    });
  }, [user]);

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', user?.email],
    queryFn: () => localApi.getWorkoutSessionsByUserEmail(user?.email),
    enabled: !!user?.email
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      updateUser(data);
      return data;
    },
    onSuccess: () => {
      setShowEditDialog(false);
    }
  });

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const thisMonthSessions = completedSessions.filter(s => isThisMonth(new Date(s.date)));
  const totalMinutes = completedSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const menuItems = [
    { icon: Dumbbell, label: 'Gerenciar Treinos', page: 'ManageWorkouts' },
    { icon: Calendar, label: 'Histórico Completo', page: 'History' },
    { icon: Dumbbell, label: 'Biblioteca de Exercícios', page: 'ExerciseLibrary' },
    ...(user?.user_type === 'personal' || user?.user_type === 'admin'
      ? [{ icon: Settings, label: 'Templates de Treino', page: 'WorkoutTemplates' }]
      : [])
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="px-5 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <button className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-xl font-bold">Perfil</h1>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 rounded-2xl border border-zinc-800 p-6 mb-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-zinc-800 border-4 border-yellow-500 flex items-center justify-center overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-zinc-400" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user?.full_name || 'Usuário'}</h2>
              <p className="text-zinc-500 text-sm">{user?.email}</p>
              {user?.goal && (
                <p className="text-yellow-400 text-sm mt-1">Meta: {user.goal}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{completedSessions.length}</p>
              <p className="text-xs text-zinc-500">Treinos</p>
            </div>
            <div className="text-center border-x border-zinc-800">
              <p className="text-2xl font-bold text-white">{totalHours}h</p>
              <p className="text-xs text-zinc-500">Tempo Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{thisMonthSessions.length}</p>
              <p className="text-xs text-zinc-500">Este Mês</p>
            </div>
          </div>
        </motion.div>

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Informações</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditDialog(true)}
              className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
            >
              Editar
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-zinc-500">Altura</p>
              <p className="font-semibold">{user?.height || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Peso</p>
              <p className="font-semibold">{user?.weight_kg ? `${user.weight_kg} kg` : '-'}</p>
            </div>
          </div>
        </motion.div>

        {/* Menu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden mb-6"
        >
          {menuItems.map((item, index) => (
            <Link key={item.page} to={createPageUrl(item.page)}>
              <div className={`flex items-center gap-4 p-4 hover:bg-zinc-800/50 transition-colors ${
                index < menuItems.length - 1 ? 'border-b border-zinc-800' : ''
              }`}>
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="flex-1 font-medium">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-zinc-600" />
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleLogout}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sair da Conta
          </Button>
        </motion.div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-zinc-400">Altura</Label>
              <Input
                placeholder="Ex: 1.75m"
                value={editForm.height}
                onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>
            <div>
              <Label className="text-zinc-400">Peso (kg)</Label>
              <Input
                type="number"
                placeholder="Ex: 75"
                value={editForm.weight_kg}
                onChange={(e) => setEditForm({ ...editForm, weight_kg: e.target.value })}
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>
            <div>
              <Label className="text-zinc-400">Objetivo</Label>
              <Input
                placeholder="Ex: Ganhar massa muscular"
                value={editForm.goal}
                onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>

            <Button
              onClick={() => updateProfileMutation.mutate(editForm)}
              disabled={updateProfileMutation.isPending}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {updateProfileMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}