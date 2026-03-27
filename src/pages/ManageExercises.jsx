import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl, parseWeightForInput, formatWeightDisplay } from "@/utils";
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
import { useAuth } from "@/lib/AuthContext";

export default function ManageExercises() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAluno = user?.user_type === "aluno";

  const urlParams = new URLSearchParams(window.location.search);
  const workoutId = urlParams.get('workout_id');
  const isTemplateWorkout = workoutId?.startsWith?.("template:");

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
    rest_seconds: '',
    method_group: ''
  });
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [editingWeightExercise, setEditingWeightExercise] = useState(null);
  const [weightValue, setWeightValue] = useState("");

  const { data: workout } = useQuery({
    queryKey: ['workout', workoutId],
    queryFn: () => workoutId ? localApi.getWorkoutById(workoutId) : null,
    enabled: !!workoutId
  });

  const hasMethodGroups = ['bi-set', 'tri-set', 'circuito'].includes(workout?.training_method || '');

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

  const updateWeightMutation = useMutation({
    mutationFn: ({ id, weight }) => localApi.updateExercise(id, { weight: weight || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      queryClient.invalidateQueries({ queryKey: ['exercises', workoutId] });
      setWeightDialogOpen(false);
      setEditingWeightExercise(null);
      setWeightValue("");
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
        weight: parseWeightForInput(templateExercise.weight) || '',
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
        weight: parseWeightForInput(exercise.weight) || '',
        rest_seconds: exercise.rest_seconds?.toString() || '',
        method_group: exercise.method_group != null ? String(exercise.method_group) : ''
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
        rest_seconds: '',
        method_group: ''
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
    if (hasMethodGroups) {
      data.method_group = formData.method_group ? parseInt(formData.method_group, 10) : null;
    }

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
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-zinc-500 text-sm">{workout?.name}</p>
                {hasMethodGroups && (
                  <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                    {workout?.training_method === 'bi-set' ? 'Bi-set' : workout?.training_method === 'tri-set' ? 'Tri-set' : 'Circuito'}
                  </span>
                )}
              </div>
            </div>
          </div>
          {!isAluno && (
            <div className="flex gap-2">
              <Button
                onClick={() => setShowLibraryDialog(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                <Plus className="w-5 h-5 mr-1" />
                Da Biblioteca
              </Button>
            </div>
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
        ) : exercises.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Weight className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum exercício cadastrado</h3>
            <p className="text-zinc-500 mb-6">
              {isAluno ? "Não há exercícios neste treino." : "Adicione exercícios a este treino"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const renderExercise = (exercise, index, showGroupBadge) => (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden"
                >
                  <div className="flex">
                    <div className="w-24 h-24 bg-zinc-800 flex-shrink-0">
                      {exercise.image_url ? (
                        <img src={exercise.image_url} alt={exercise.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Weight className="w-8 h-8 text-zinc-700" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-3 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {showGroupBadge && exercise.method_group && (
                            <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs">Grupo {exercise.method_group}</span>
                          )}
                          <span className="text-yellow-400 text-sm font-bold">#{index + 1}</span>
                          <h3 className="font-semibold text-white">{exercise.name}</h3>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-500 text-sm">
                          <span>{exercise.sets} séries</span>
                          <span>×</span>
                          <span>{exercise.reps} reps</span>
                          {exercise.weight != null && exercise.weight !== "" && <><span>•</span><span>{formatWeightDisplay(exercise.weight)}</span></>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {isAluno && !isTemplateWorkout ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingWeightExercise(exercise);
                              setWeightValue(parseWeightForInput(exercise.weight));
                              setWeightDialogOpen(true);
                            }}
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                          >
                            <Weight className="w-4 h-4 mr-1" />
                            Carga
                          </Button>
                        ) : !isAluno && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(exercise)} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(exercise.id)} className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {isAluno && isTemplateWorkout && (
                          <span className="text-xs text-zinc-500">Carga definida pelo personal</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );

              if (!hasMethodGroups) {
                return exercises.map((ex, i) => renderExercise(ex, i, false));
              }
              const groups = {};
              exercises.forEach((ex) => {
                const g = ex.method_group ?? 0;
                if (!groups[g]) groups[g] = [];
                groups[g].push(ex);
              });
              const sortedGroups = Object.keys(groups).map(Number).sort((a, b) => a - b);
              let globalIndex = 0;
              const methodLabel = workout?.training_method === 'bi-set' ? 'Bi-set' : workout?.training_method === 'tri-set' ? 'Tri-set' : 'Circuito';
              return sortedGroups.map((gKey) => {
                const groupExercises = groups[gKey];
                const groupHeader = gKey === 0 ? null : (
                  <div className="px-3 py-2 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-sm font-medium">
                    Grupo {gKey} ({methodLabel}) — executar combinadamente
                  </div>
                );
                return (
                  <div key={gKey} className="space-y-2">
                    {groupHeader}
                    {groupExercises.map((exercise) => renderExercise(exercise, globalIndex++, true))}
                  </div>
                );
              });
            })()}
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
                <Label className="text-zinc-400">Carga (kg)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Ex: 30"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                  <span className="text-zinc-400 font-medium">kg</span>
                </div>
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

            {hasMethodGroups && (
              <div>
                <Label className="text-zinc-400">Grupo (executar combinadamente)</Label>
                <select
                  value={formData.method_group}
                  onChange={(e) => setFormData({ ...formData, method_group: e.target.value })}
                  className="mt-1 w-full h-10 rounded-md bg-zinc-800 border border-zinc-700 px-3 text-white"
                >
                  <option value="">— Nenhum</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                    <option key={g} value={g}>Grupo {g}</option>
                  ))}
                </select>
                <p className="text-xs text-zinc-500 mt-1">
                  Exercícios no mesmo grupo são feitos combinadamente ({workout?.training_method === 'bi-set' ? '2 juntos' : workout?.training_method === 'tri-set' ? '3 juntos' : 'em sequência'})
                </p>
              </div>
            )}

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

      {/* Weight-only Dialog (for aluno) */}
      <Dialog open={weightDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setWeightDialogOpen(false);
          setEditingWeightExercise(null);
          setWeightValue("");
        }
      }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Editar carga — {editingWeightExercise?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-zinc-400">Carga (kg)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="Ex: 30"
                  value={weightValue}
                  onChange={(e) => setWeightValue(e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                />
                <span className="text-zinc-400 font-medium">kg</span>
              </div>
            </div>
            <Button
              onClick={() => editingWeightExercise && updateWeightMutation.mutate({ id: editingWeightExercise.id, weight: weightValue.trim() || null })}
              disabled={updateWeightMutation.isPending}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {updateWeightMutation.isPending ? "Salvando..." : "Salvar"}
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
                          {exercise.sets} × {exercise.reps} {exercise.weight != null && exercise.weight !== "" && `• ${formatWeightDisplay(exercise.weight)}`}
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