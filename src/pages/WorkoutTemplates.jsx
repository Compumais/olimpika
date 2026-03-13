import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Plus, Edit, Trash2, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/AuthContext";
import { localApi } from "@/api/localApiClient";

export default function WorkoutTemplates() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.user_type === "admin";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    short_name: "",
    description: "",
    estimated_duration: "",
    muscle_groups: "",
    color: "bg-yellow-500",
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["workout-templates"],
    queryFn: () => localApi.getWorkoutTemplates(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => localApi.createWorkoutTemplate(data, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-templates"] });
      handleCloseDialog();
    },
    onError: (err) => setErrorMessage(err?.message ?? "Erro ao criar template."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localApi.updateWorkoutTemplate(id, data, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-templates"] });
      handleCloseDialog();
    },
    onError: (err) => setErrorMessage(err?.message ?? "Erro ao atualizar template."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localApi.deleteWorkoutTemplate(id, user),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workout-templates"] }),
    onError: (err) => setErrorMessage(err?.message ?? "Erro ao excluir template."),
  });

  const handleOpenDialog = (template = null) => {
    setErrorMessage("");
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name || "",
        short_name: template.short_name || "",
        description: template.description || "",
        estimated_duration: template.estimated_duration || "",
        muscle_groups: template.muscle_groups || "",
        color: template.color || "bg-yellow-500",
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: "",
        short_name: "",
        description: "",
        estimated_duration: "",
        muscle_groups: "",
        color: "bg-yellow-500",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setErrorMessage("");
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    const payload = {
      ...formData,
      muscle_groups: formData.muscle_groups,
      estimated_duration: formData.estimated_duration ? String(formData.estimated_duration) : null,
    };
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      <div className="sticky top-0 z-40 bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("PersonalHome")}>
              <Button variant="ghost" size="icon" className="text-zinc-400">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Templates de Treino</h1>
              <p className="text-sm text-zinc-500">{templates.length} template(s) compartilhado(s)</p>
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
        {isLoading ? (
          <div className="text-center py-12 text-zinc-500">Carregando...</div>
        ) : templates.length === 0 ? (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-12 text-center">
            <Dumbbell className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum template cadastrado</h3>
            <p className="text-zinc-500 mb-6">Personais podem criar templates compartilhados.</p>
            <Button onClick={() => handleOpenDialog()} className="bg-yellow-500 hover:bg-yellow-600 text-black">
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro template
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {templates.map((t) => (
              <div key={t.id} className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded ${t.color || "bg-zinc-700"} text-xs font-bold text-white`}>
                        {t.short_name || "TMP"}
                      </span>
                      <h3 className="font-semibold">{t.name}</h3>
                    </div>
                    {t.description && <p className="text-sm text-zinc-400 mt-1">{t.description}</p>}
                    <p className="text-xs text-zinc-500 mt-2">
                      {t.muscle_groups || "Sem grupos musculares definidos"}
                      {t.estimated_duration ? ` • ${t.estimated_duration} min` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={createPageUrl(`TemplateExercises?template_id=${t.id}`)}>
                      <Button variant="outline" className="border-zinc-700 text-white">
                        Exercícios
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(t)}
                      className="text-zinc-400 hover:text-yellow-400"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(t.id)}
                        className="text-zinc-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Editar Template" : "Novo Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>
            <div>
              <Label>Sigla</Label>
              <Input
                value={formData.short_name}
                onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
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
            <div>
              <Label>Grupos musculares</Label>
              <Input
                placeholder="Peito, Tríceps"
                value={formData.muscle_groups}
                onChange={(e) => setFormData({ ...formData, muscle_groups: e.target.value })}
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>
            <div>
              <Label>Duração estimada (min)</Label>
              <Input
                type="number"
                value={formData.estimated_duration}
                onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                className="bg-zinc-800 border-zinc-700 mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} className="border-zinc-700 text-white">
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
