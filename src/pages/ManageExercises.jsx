import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, Reorder } from "framer-motion";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit, 
  GripVertical,
  Image,
  Video,
  Weight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { localApi } from "@/api/localApiClient";

export default function ManageExercises() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const workoutId = urlParams.get('workout_id');

  const [showDialog, setShowDialog] = useState(false);
  const [showLibraryDialog, setShowLibraryDialog] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [editingExercise, setEditingExercise] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    video_url: '',
    sets: '',
    reps: '',
    weight: '',
    rest_seconds: ''
  });

  const { data: workout } = useQuery({
    queryKey: ['workout', workoutId],
    queryFn: () => workoutId ? localApi.getWorkoutById(workoutId) : null,
    enabled: !!workoutId
  });

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises', workoutId],
    queryFn: () => localApi.getExercisesByWorkoutId(workoutId),
    enabled: !!workoutId
  });

  const { data: libraryExercises = [] } = useQuery({
    queryKey: ['exercise-library'],
    queryFn: () => localApi.getTemplateExercises()
  });

  const createMutation = useMutation({
    mutationFn: (data) => localApi.createExercise(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      handleCloseDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localApi.updateExercise(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      handleCloseDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localApi.deleteExercise(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    }
  });

  const addFromLibraryMutation = useMutation({
    mutationFn: (templateExercise) => {
      if (!workoutId) {
        throw new Error('Treino não selecionado.');
      }
      const data = {
        workout_id: workoutId,
        name: templateExercise.name || '',
        description: templateExercise.description ?? '',
        image_url: templateExercise.image_url ?? '',
        video_url: templateExercise.video_url ?? '',
        sets: String(templateExercise.sets ?? 3),
        reps: String(templateExercise.reps ?? '12'),
        weight: String(templateExercise.weight ?? ''),
        rest_seconds: String(templateExercise.rest_seconds ?? 60),
        muscle_group: templateExercise.muscle_group ?? '',
        order: exercises.length,
        is_template: false
      };
      return localApi.createExercise(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      queryClient.invalidateQueries({ queryKey: ['exercises', workoutId] });
      setLibraryError("");
      setShowLibraryDialog(false);
    },
    onError: (err) => {
      setLibraryError(err?.message ?? "Não foi possível adicionar o exercício.");
    }
  });

  const handleOpenDialog = (exercise = null) => {
    if (exercise) {
      setEditingExercise(exercise);
      setFormData({
        name: exercise.name,
        description: exercise.description || '',
        image_url: exercise.image_url || '',
        video_url: exercise.video_url || '',
        sets: exercise.sets?.toString() || '',
        reps: exercise.reps || '',
        weight: exercise.weight || '',
        rest_seconds: exercise.rest_seconds?.toString() || ''
      });
    } else {
      setEditingExercise(null);
      setFormData({
        name: '',
        description: '',
        image_url: '',
        video_url: '',
        sets: '',
        reps: '',
        weight: '',
        rest_seconds: ''
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingExercise(null);
  };

  const handleSubmit = () => {
    const data = {
      workout_id: workoutId,
      name: formData.name,
      description: formData.description,
      image_url: formData.image_url,
      video_url: formData.video_url,
      sets: formData.sets ? parseInt(formData.sets) : null,
      reps: formData.reps,
      weight: formData.weight,
      rest_seconds: formData.rest_seconds ? parseInt(formData.rest_seconds) : null,
      order: editingExercise?.order ?? exercises.length
    };

    if (editingExercise) {
      updateMutation.mutate({ id: editingExercise.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('ManageWorkouts')}>
              <button className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Exercícios</h1>
              <p className="text-zinc-500 text-sm">{workout?.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowLibraryDialog(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Plus className="w-5 h-5 mr-1" />
              Da Biblioteca
            </Button>
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 rounded-2xl bg-zinc-800" />
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Weight className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum exercício cadastrado</h3>
            <p className="text-zinc-500 mb-6">Adicione exercícios a este treino</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden"
              >
                <div className="flex">
                  {/* Image */}
                  <div className="w-24 h-24 bg-zinc-800 flex-shrink-0">
                    {exercise.image_url ? (
                      <img 
                        src={exercise.image_url} 
                        alt={exercise.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Weight className="w-8 h-8 text-zinc-700" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-3 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-yellow-400 text-sm font-bold">#{index + 1}</span>
                        <h3 className="font-semibold text-white">{exercise.name}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-zinc-500 text-sm">
                        <span>{exercise.sets} séries</span>
                        <span>×</span>
                        <span>{exercise.reps} reps</span>
                        {exercise.weight && (
                          <>
                            <span>•</span>
                            <span>{exercise.weight}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(exercise)}
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(exercise.id)}
                        className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExercise ? 'Editar Exercício' : 'Novo Exercício'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-zinc-400">Nome do Exercício</Label>
              <Input
                placeholder="Ex: Supino Reto"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>

            <div>
              <Label className="text-zinc-400">Descrição / Instruções</Label>
              <Textarea
                placeholder="Descreva como executar o exercício..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400">URL da Imagem</Label>
                <Input
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label className="text-zinc-400">URL do Vídeo</Label>
                <Input
                  placeholder="https://..."
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-zinc-400">Séries</Label>
                <Input
                  type="number"
                  placeholder="Ex: 4"
                  value={formData.sets}
                  onChange={(e) => setFormData({ ...formData, sets: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label className="text-zinc-400">Repetições</Label>
                <Input
                  placeholder="Ex: 12"
                  value={formData.reps}
                  onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label className="text-zinc-400">Carga</Label>
                <Input
                  placeholder="Ex: 30kg"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-zinc-400">Descanso entre séries (segundos)</Label>
              <Input
                type="number"
                placeholder="Ex: 60"
                value={formData.rest_seconds}
                onChange={(e) => setFormData({ ...formData, rest_seconds: e.target.value })}
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || !formData.name}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Library Selection Dialog */}
      <Dialog open={showLibraryDialog} onOpenChange={(open) => { setShowLibraryDialog(open); if (!open) setLibraryError(""); }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar da Biblioteca</DialogTitle>
          </DialogHeader>

          {libraryError && (
            <p className="text-sm text-red-400 mt-2">{libraryError}</p>
          )}
          
          <div className="space-y-3 mt-4">
            {libraryExercises.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <p className="mb-2">Nenhum exercício na biblioteca</p>
                <Link to={createPageUrl('ExerciseLibrary')}>
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                    Ir para Biblioteca
                  </Button>
                </Link>
              </div>
            ) : (
              libraryExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="bg-zinc-800/50 rounded-xl border border-zinc-700 overflow-hidden hover:border-yellow-500/50 transition-colors"
                >
                  <div className="flex">
                    <div className="w-20 h-20 bg-zinc-800 flex-shrink-0">
                      {exercise.image_url ? (
                        <img 
                          src={exercise.image_url} 
                          alt={exercise.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Weight className="w-6 h-6 text-zinc-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white">{exercise.name}</h4>
                        <p className="text-xs text-yellow-400">{exercise.muscle_group}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {exercise.sets} × {exercise.reps} {exercise.weight && `• ${exercise.weight}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addFromLibraryMutation.mutate(exercise)}
                        disabled={addFromLibraryMutation.isPending}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}