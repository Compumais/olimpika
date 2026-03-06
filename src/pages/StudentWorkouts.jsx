import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2,
  Dumbbell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { localApi } from "@/api/localApiClient";

export default function StudentWorkouts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    short_name: "",
    description: "",
    color: "bg-blue-500"
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get student info from URL
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get('student_id');
  const studentName = decodeURIComponent(urlParams.get('student_name') || 'Aluno');

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['student-workouts', studentId],
    queryFn: () => localApi.getWorkouts({ student_id: studentId }),
    enabled: !!studentId
  });

  const createMutation = useMutation({
    mutationFn: (data) => localApi.createWorkout({ ...data, student_id: studentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-workouts'] });
      handleCloseDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localApi.updateWorkout(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-workouts'] });
      handleCloseDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localApi.deleteWorkout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-workouts'] });
    }
  });

  const handleOpenDialog = (workout = null) => {
    if (workout) {
      setEditingWorkout(workout);
      setFormData({
        name: workout.name || "",
        short_name: workout.short_name || "",
        description: workout.description || "",
        color: workout.color || "bg-blue-500"
      });
    } else {
      setEditingWorkout(null);
      setFormData({ name: "", short_name: "", description: "", color: "bg-blue-500" });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingWorkout(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.short_name) return;

    if (editingWorkout) {
      updateMutation.mutate({ id: editingWorkout.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const colors = [
    { value: "bg-blue-500", label: "Azul" },
    { value: "bg-yellow-500", label: "Amarelo" },
    { value: "bg-green-500", label: "Verde" },
    { value: "bg-red-500", label: "Vermelho" },
    { value: "bg-purple-500", label: "Roxo" },
    { value: "bg-pink-500", label: "Rosa" }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('ManageStudents')}>
              <Button variant="ghost" size="icon" className="text-zinc-400">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Treinos - {studentName}</h1>
              <p className="text-sm text-zinc-500">{workouts.length} treinos cadastrados</p>
            </div>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Treino
          </Button>
        </div>
      </div>

      {/* Workouts List */}
      <div className="px-4 py-6">
        {isLoading ? (
          <div className="text-center py-12 text-zinc-500">Carregando...</div>
        ) : workouts.length === 0 ? (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-12 text-center">
            <Dumbbell className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum treino cadastrado</h3>
            <p className="text-zinc-500 mb-6">Crie treinos personalizados para {studentName}</p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Plus className="w-5 h-5 mr-2" />
              Criar primeiro treino
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {workouts.map((workout, index) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden"
              >
                <div className={`h-2 ${workout.color}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-3 py-1 rounded-full ${workout.color} text-white text-sm font-bold`}>
                          {workout.short_name}
                        </span>
                        <h3 className="font-semibold text-lg">{workout.name}</h3>
                      </div>
                      {workout.description && (
                        <p className="text-zinc-400 text-sm">{workout.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(createPageUrl('ManageExercises') + `?workout_id=${workout.id}`)}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
                    >
                      <Dumbbell className="w-4 h-4 mr-2" />
                      Gerenciar Exercícios
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(workout)}
                      className="text-zinc-400 hover:text-yellow-400"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(workout.id)}
                      className="text-zinc-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {editingWorkout ? "Editar Treino" : "Novo Treino"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nome do Treino *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Treino A - Peito e Tríceps"
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
              />
            </div>

            <div>
              <Label>Nome Curto *</Label>
              <Input
                value={formData.short_name}
                onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                placeholder="Ex: A"
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o foco deste treino..."
                className="bg-zinc-800 border-zinc-700 text-white min-h-24 mt-1"
              />
            </div>

            <div>
              <Label>Cor do Card</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.color === color.value
                        ? 'border-white scale-105'
                        : 'border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    <div className={`w-full h-8 rounded ${color.value}`} />
                    <p className="text-xs text-center mt-2">{color.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              className="border-zinc-700 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.short_name || createMutation.isPending || updateMutation.isPending}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {editingWorkout ? "Salvar Alterações" : "Criar Treino"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}