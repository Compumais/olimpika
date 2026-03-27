import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl, parseWeightForInput, formatWeightDisplay } from "@/utils";
import { ArrowLeft, Plus, Edit, Trash2, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/AuthContext";
import { localApi } from "@/api/localApiClient";

export default function TemplateExercises() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const params = new URLSearchParams(window.location.search);
  const templateId = params.get("template_id");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    video_url: "",
    sets: "",
    reps: "",
    weight: "",
    rest_seconds: "",
    order: "",
    muscle_group: "",
    method_group: "",
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["workout-templates"],
    queryFn: () => localApi.getWorkoutTemplates(),
  });

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["template-exercises", templateId],
    queryFn: () => localApi.getTemplateExercisesByTemplateId(templateId),
    enabled: !!templateId,
  });

  const currentTemplate = templates.find((t) => t.id === templateId);
  const hasMethodGroups = ["bi-set", "tri-set", "circuito"].includes(currentTemplate?.training_method || "");

  const createMutation = useMutation({
    mutationFn: (data) => localApi.createTemplateExercise(templateId, data, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-exercises", templateId] });
      handleCloseDialog();
    },
    onError: (err) => setErrorMessage(err?.message ?? "Erro ao criar exercício."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localApi.updateTemplateExercise(templateId, id, data, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-exercises", templateId] });
      handleCloseDialog();
    },
    onError: (err) => setErrorMessage(err?.message ?? "Erro ao atualizar exercício."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localApi.deleteTemplateExercise(templateId, id, user),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["template-exercises", templateId] }),
    onError: (err) => setErrorMessage(err?.message ?? "Erro ao excluir exercício."),
  });

  const handleOpenDialog = (exercise = null) => {
    setErrorMessage("");
    if (exercise) {
      setEditingExercise(exercise);
      setFormData({
        name: exercise.name || "",
        description: exercise.description || "",
        image_url: exercise.image_url || "",
        video_url: exercise.video_url || "",
        sets: exercise.sets || "",
        reps: exercise.reps || "",
        weight: parseWeightForInput(exercise.weight) || "",
        rest_seconds: exercise.rest_seconds || "",
        order: exercise.order || "",
        muscle_group: exercise.muscle_group || "",
        method_group: exercise.method_group != null ? String(exercise.method_group) : "",
      });
    } else {
      setEditingExercise(null);
      setFormData({
        name: "",
        description: "",
        image_url: "",
        video_url: "",
        sets: "",
        reps: "",
        weight: "",
        rest_seconds: "",
        order: String(exercises.length + 1),
        muscle_group: "",
        method_group: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingExercise(null);
    setErrorMessage("");
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    const payload = { ...formData };
    if (hasMethodGroups && formData.method_group) {
      payload.method_group = parseInt(formData.method_group, 10);
    }
    if (payload.method_group === "" || payload.method_group === undefined) delete payload.method_group;
    if (editingExercise) {
      updateMutation.mutate({ id: editingExercise.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      <div className="sticky top-0 z-40 bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("WorkoutTemplates")}>
              <Button variant="ghost" size="icon" className="text-zinc-400">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Exercícios do Template</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm text-zinc-500">{currentTemplate?.name || "Template"}</p>
                {hasMethodGroups && (
                  <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                    {currentTemplate?.training_method === "bi-set" ? "Bi-set" : currentTemplate?.training_method === "tri-set" ? "Tri-set" : "Circuito"}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()} className="bg-yellow-500 hover:bg-yellow-600 text-black">
            <Plus className="w-4 h-4 mr-2" />
            Novo
          </Button>
        </div>
      </div>

      <div className="p-4">
        {errorMessage && <p className="mb-4 text-sm text-red-400">{errorMessage}</p>}
        {!templateId ? (
          <p className="text-zinc-400">Template inválido.</p>
        ) : isLoading ? (
          <p className="text-zinc-500">Carregando...</p>
        ) : exercises.length === 0 ? (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-12 text-center">
            <Dumbbell className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sem exercícios no template</h3>
            <p className="text-zinc-500 mb-6">Adicione exercícios para reutilizar com seus alunos.</p>
            <Button onClick={() => handleOpenDialog()} className="bg-yellow-500 hover:bg-yellow-600 text-black">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar exercício
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              if (!hasMethodGroups) {
                return exercises.map((exercise) => (
                  <div key={exercise.id} className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{exercise.name}</h3>
                        <p className="text-sm text-zinc-400">{exercise.description || "Sem descrição"}</p>
                        <p className="text-xs text-zinc-500 mt-2">
                          {exercise.sets || "-"} x {exercise.reps || "-"}
                          {exercise.weight != null && exercise.weight !== "" ? ` • ${formatWeightDisplay(exercise.weight)}` : ""}
                          {exercise.muscle_group ? ` • ${exercise.muscle_group}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(exercise)} className="text-zinc-400 hover:text-yellow-400">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(exercise.id)} className="text-zinc-400 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ));
              }
              const groups = {};
              exercises.forEach((ex) => {
                const g = ex.method_group ?? 0;
                if (!groups[g]) groups[g] = [];
                groups[g].push(ex);
              });
              const sortedGroups = Object.keys(groups).map(Number).sort((a, b) => a - b);
              const methodLabel = currentTemplate?.training_method === "bi-set" ? "Bi-set" : currentTemplate?.training_method === "tri-set" ? "Tri-set" : "Circuito";
              return sortedGroups.map((gKey) => (
                <div key={gKey} className="space-y-2">
                  {gKey !== 0 && (
                    <div className="px-3 py-2 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-sm font-medium">
                      Grupo {gKey} ({methodLabel}) — executar combinadamente
                    </div>
                  )}
                  {groups[gKey].map((exercise) => (
                    <div key={exercise.id} className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {exercise.method_group && (
                              <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs">Grupo {exercise.method_group}</span>
                            )}
                            <h3 className="font-semibold">{exercise.name}</h3>
                          </div>
                          <p className="text-sm text-zinc-400">{exercise.description || "Sem descrição"}</p>
                          <p className="text-xs text-zinc-500 mt-2">
                            {exercise.sets || "-"} x {exercise.reps || "-"}
                            {exercise.weight != null && exercise.weight !== "" ? ` • ${formatWeightDisplay(exercise.weight)}` : ""}
                            {exercise.muscle_group ? ` • ${exercise.muscle_group}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(exercise)} className="text-zinc-400 hover:text-yellow-400">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(exercise.id)} className="text-zinc-400 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>{editingExercise ? "Editar Exercício" : "Novo Exercício"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Séries</Label>
                <Input
                  value={formData.sets}
                  onChange={(e) => setFormData({ ...formData, sets: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label>Repetições</Label>
                <Input
                  value={formData.reps}
                  onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label>Carga (kg)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="bg-zinc-800 border-zinc-700"
                  />
                  <span className="text-zinc-400 font-medium">kg</span>
                </div>
              </div>
              <div>
                <Label>Descanso (s)</Label>
                <Input
                  value={formData.rest_seconds}
                  onChange={(e) => setFormData({ ...formData, rest_seconds: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label>Ordem</Label>
                <Input
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label>Grupo muscular</Label>
                <Input
                  value={formData.muscle_group}
                  onChange={(e) => setFormData({ ...formData, muscle_group: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
            </div>
            {hasMethodGroups && (
              <div>
                <Label>Grupo (executar combinadamente)</Label>
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
                <p className="text-xs text-zinc-500 mt-1">Exercícios no mesmo grupo são feitos combinadamente</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleCloseDialog} className="bg-yellow-500 hover:bg-yellow-600 text-black">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name.trim() || createMutation.isPending || updateMutation.isPending}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
