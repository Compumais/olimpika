import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl, parseWeightForInput, formatWeightDisplay } from "@/utils";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Dumbbell,
  X,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { localApi } from "@/api/localApiClient";

export default function ExerciseLibrary() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [filterMuscleGroup, setFilterMuscleGroup] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    video_url: "",
    muscle_group: "Peito",
    sets: 3,
    reps: "12",
    weight: "",
    rest_seconds: 60
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const queryClient = useQueryClient();

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercise-library'],
    queryFn: () => localApi.getTemplateExercises()
  });

  const createMutation = useMutation({
    mutationFn: (data) => localApi.createExercise({ ...data, is_template: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-library'] });
      handleCloseDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localApi.updateExercise(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-library'] });
      handleCloseDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localApi.deleteExercise(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-library'] });
    }
  });

  const handleOpenDialog = (exercise = null) => {
    if (exercise) {
      setEditingExercise(exercise);
      setFormData({
        name: exercise.name || "",
        description: exercise.description || "",
        image_url: exercise.image_url || "",
        video_url: exercise.video_url || "",
        muscle_group: exercise.muscle_group || "Peito",
        sets: exercise.sets || 3,
        reps: exercise.reps || "12",
        weight: parseWeightForInput(exercise.weight) || "",
        rest_seconds: exercise.rest_seconds || 60
      });
    } else {
      setEditingExercise(null);
      setFormData({
        name: "",
        description: "",
        image_url: "",
        video_url: "",
        muscle_group: "Peito",
        sets: 3,
        reps: "12",
        weight: "",
        rest_seconds: 60
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingExercise(null);
  };

  const handleSubmit = () => {
    if (!formData.name) return;

    if (editingExercise) {
      updateMutation.mutate({ id: editingExercise.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Upload de imagem removido no backend local: use campo de URL diretamente

  const filteredExercises = filterMuscleGroup === "all" 
    ? exercises 
    : exercises.filter(ex => ex.muscle_group === filterMuscleGroup);

  const muscleGroups = ["Peito", "Costas", "Pernas", "Ombros", "Bíceps", "Tríceps", "Abdômen", "Panturrilha"];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Profile')}>
              <Button variant="ghost" size="icon" className="text-zinc-400">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Biblioteca de Exercícios</h1>
              <p className="text-sm text-zinc-500">{exercises.length} exercícios</p>
            </div>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="p-4">
        <Tabs value={filterMuscleGroup} onValueChange={setFilterMuscleGroup} className="w-full">
          <TabsList className="w-full bg-zinc-900 grid grid-cols-3 lg:grid-cols-5 gap-2">
            <TabsTrigger value="all" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              Todos
            </TabsTrigger>
            {muscleGroups.slice(0, 4).map(group => (
              <TabsTrigger 
                key={group} 
                value={group}
                className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-xs"
              >
                {group}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Exercise List */}
      <div className="px-4">
        {isLoading ? (
          <div className="text-center py-12 text-zinc-500">Carregando...</div>
        ) : filteredExercises.length === 0 ? (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-12 text-center">
            <Dumbbell className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum exercício cadastrado</h3>
            <p className="text-zinc-500 mb-6">Crie exercícios para usar nos treinos dos alunos</p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Plus className="w-5 h-5 mr-2" />
              Criar primeiro exercício
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredExercises.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden"
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 bg-zinc-800 flex-shrink-0">
                    {exercise.image_url ? (
                      <img 
                        src={exercise.image_url} 
                        alt={exercise.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Dumbbell className="w-8 h-8 text-zinc-600" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 py-3 pr-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-white">{exercise.name}</h3>
                        <p className="text-xs text-yellow-400">{exercise.muscle_group}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(exercise)}
                          className="h-8 w-8 text-zinc-400 hover:text-yellow-400"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(exercise.id)}
                          className="h-8 w-8 text-zinc-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs text-zinc-500">
                      <span>{exercise.sets} séries</span>
                      <span>•</span>
                      <span>{exercise.reps} reps</span>
                      {(exercise.weight != null && exercise.weight !== "") && (
                        <>
                          <span>•</span>
                          <span>{formatWeightDisplay(exercise.weight)}</span>
                        </>
                      )}
                    </div>
                    {exercise.video_url && (
                      <div className="mt-2 p-2 bg-zinc-800 rounded-lg">
                        <p className="text-xs text-zinc-500 mb-1">Vídeo:</p>
                        <a 
                          href={exercise.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-yellow-400 hover:text-yellow-300 break-all underline"
                        >
                          {exercise.video_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExercise ? "Editar Exercício" : "Novo Exercício"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nome do Exercício *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Supino Reto com Barra"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div>
              <Label>Grupo Muscular *</Label>
              <Select
                value={formData.muscle_group}
                onValueChange={(value) => setFormData({ ...formData, muscle_group: value })}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {muscleGroups.map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descrição/Instruções</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva como executar o exercício..."
                className="bg-zinc-800 border-zinc-700 text-white min-h-24"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Séries</Label>
                <Input
                  type="number"
                  value={formData.sets}
                  onChange={(e) => setFormData({ ...formData, sets: parseInt(e.target.value) || 0 })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label>Repetições</Label>
                <Input
                  value={formData.reps}
                  onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                  placeholder="12 ou 10-12"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label>Carga (kg)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="Ex: 40"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  <span className="text-zinc-400 font-medium">kg</span>
                </div>
              </div>
            </div>

            <div>
              <Label>Descanso (segundos)</Label>
              <Input
                type="number"
                value={formData.rest_seconds}
                onChange={(e) => setFormData({ ...formData, rest_seconds: parseInt(e.target.value) || 0 })}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            {/* Image URL */}
            <div>
              <Label>URL da Imagem do Exercício</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg"
                className="bg-zinc-800 border-zinc-700 text-white mt-2"
              />
            </div>

            {/* Video URL */}
            <div>
              <Label>URL do Vídeo Demonstrativo</Label>
              <Input
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://exemplo.com/video.mp4"
                className="bg-zinc-800 border-zinc-700 text-white mt-2"
              />
              {formData.video_url && (
                <p className="text-xs text-zinc-500 mt-2">
                  Cole a URL do vídeo hospedado (YouTube, Vimeo, ou link direto)
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleCloseDialog}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {editingExercise ? "Salvar Alterações" : "Criar Exercício"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}