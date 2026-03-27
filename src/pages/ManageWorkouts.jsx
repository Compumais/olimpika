import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit, 
  Dumbbell,
  Clock,
  ChevronRight,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { localApi } from "@/api/localApiClient";
import { useAuth } from "@/lib/AuthContext";

export default function ManageWorkouts() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAluno = user?.user_type === "aluno";

  const [showDialog, setShowDialog] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    description: '',
    estimated_duration: '',
    muscle_groups: ''
  });

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['workouts', user?.user_type, user?.student_id],
    queryFn: () => {
      if (isAluno && user?.student_id) {
        return localApi.getWorkouts({ student_id: user.student_id });
      }
      return localApi.getWorkouts();
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => localApi.createWorkout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      handleCloseDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localApi.updateWorkout(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      handleCloseDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localApi.deleteWorkout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    }
  });

  const handleOpenDialog = (workout = null) => {
    if (workout) {
      setEditingWorkout(workout);
      setFormData({
        name: workout.name,
        short_name: workout.short_name,
        description: workout.description || '',
        estimated_duration: workout.estimated_duration || '',
        muscle_groups: workout.muscle_groups?.join(', ') || ''
      });
    } else {
      setEditingWorkout(null);
      setFormData({
        name: '',
        short_name: '',
        description: '',
        estimated_duration: '',
        muscle_groups: ''
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingWorkout(null);
  };

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      short_name: formData.short_name,
      description: formData.description,
      estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null,
      muscle_groups: formData.muscle_groups ? formData.muscle_groups.split(',').map(s => s.trim()) : []
    };

    if (editingWorkout) {
      updateMutation.mutate({ id: editingWorkout.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const colors = [
    "from-yellow-600 to-yellow-800",
    "from-amber-600 to-amber-800",
    "from-orange-600 to-orange-800",
    "from-yellow-500 to-amber-700",
    "from-amber-500 to-orange-700"
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Profile')}>
              <button className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <h1 className="text-xl font-bold">Gerenciar Treinos</h1>
          </div>
          {!isAluno && (
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Plus className="w-5 h-5 mr-1" />
              Novo
            </Button>
          )}
        </div>
      </div>

      <div className="px-5 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 rounded-2xl bg-zinc-800" />
            ))}
          </div>
        ) : workouts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum treino</h3>
            <p className="text-zinc-500 mb-6">
              {isAluno ? "Seu personal ainda não cadastrou treinos para você." : "Crie seu primeiro treino para começar"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout, index) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors[index % colors.length]} p-4`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <span className="text-lg font-black">{workout.short_name}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{workout.name}</h3>
                    <div className="flex items-center gap-3 text-white/70 text-sm">
                      {workout.estimated_duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {workout.estimated_duration} min
                        </span>
                      )}
                      {workout.muscle_groups?.length > 0 && (
                        <span>{workout.muscle_groups.length} grupos</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={createPageUrl(`ManageExercises?workout_id=${workout.id}`)}>
                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                        <Dumbbell className="w-4 h-4" />
                      </Button>
                    </Link>
                    {!isAluno && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDialog(workout)}
                          className="text-white hover:bg-white/20"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(workout.id)}
                          className="text-white hover:bg-red-500/50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>{editingWorkout ? 'Editar Treino' : 'Novo Treino'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label className="text-zinc-400">Nome do Treino</Label>
                <Input
                  placeholder="Ex: Peito e Tríceps"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label className="text-zinc-400">Sigla</Label>
                <Input
                  placeholder="Ex: A"
                  value={formData.short_name}
                  onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-zinc-400">Descrição (opcional)</Label>
              <Textarea
                placeholder="Descreva o treino..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>

            <div>
              <Label className="text-zinc-400">Duração estimada (minutos)</Label>
              <Input
                type="number"
                placeholder="Ex: 60"
                value={formData.estimated_duration}
                onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>

            <div>
              <Label className="text-zinc-400">Grupos musculares (separados por vírgula)</Label>
              <Input
                placeholder="Ex: Peito, Tríceps, Ombros"
                value={formData.muscle_groups}
                onChange={(e) => setFormData({ ...formData, muscle_groups: e.target.value })}
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}