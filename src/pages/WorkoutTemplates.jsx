import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Edit, Trash2, Dumbbell, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
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
    training_method: "",
  });

  const TRAINING_METHODS = [
    { value: "", label: "Tradicional" },
    { value: "bi-set", label: "Bi-set" },
    { value: "tri-set", label: "Tri-set" },
    { value: "circuito", label: "Circuito" },
  ];

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
        training_method: template.training_method || "",
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
        training_method: "",
      });
    }
    setDialogOpen(true);
  };

  const colors = [
    "from-yellow-600 to-yellow-800",
    "from-amber-600 to-amber-800",
    "from-orange-600 to-orange-800",
    "from-yellow-500 to-amber-700",
    "from-amber-500 to-orange-700"
  ];

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
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("PersonalHome")}>
              <button className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <h1 className="text-xl font-bold">Templates de Treino</h1>
          </div>
          <Button onClick={() => handleOpenDialog()} className="bg-yellow-500 hover:bg-yellow-600 text-black">
            <Plus className="w-5 h-5 mr-1" />
            Novo
          </Button>
        </div>
      </div>

      <div className="px-5 py-6">
        {errorMessage && <p className="mb-4 text-sm text-red-400">{errorMessage}</p>}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl bg-zinc-800" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum template cadastrado</h3>
            <p className="text-zinc-500 mb-6">Personais podem criar templates compartilhados.</p>
            <Button onClick={() => handleOpenDialog()} className="bg-yellow-500 hover:bg-yellow-600 text-black">
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro template
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((t, index) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors[index % colors.length]} p-4`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <span className="text-lg font-black">{t.short_name || "TMP"}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold">{t.name}</h3>
                      {t.training_method && (
                        <span className="px-2 py-0.5 rounded bg-white/20 text-white text-xs font-medium">
                          {t.training_method === "bi-set" ? "Bi-set" : t.training_method === "tri-set" ? "Tri-set" : t.training_method === "circuito" ? "Circuito" : t.training_method}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-white/70 text-sm">
                      {t.estimated_duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t.estimated_duration} min
                        </span>
                      )}
                      {t.muscle_groups && (
                        <span>
                          {t.muscle_groups.split(",").filter(Boolean).length} grupos
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={createPageUrl(`TemplateExercises?template_id=${t.id}`)}>
                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                        <Dumbbell className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDialog(t)}
                      className="text-white hover:bg-white/20"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(t.id)}
                        className="text-white hover:bg-red-500/50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
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
            <div>
              <Label>Método de Treino</Label>
              <select
                value={formData.training_method}
                onChange={(e) => setFormData({ ...formData, training_method: e.target.value })}
                className="mt-1 w-full h-10 rounded-md bg-zinc-800 border border-zinc-700 px-3 text-white"
              >
                {TRAINING_METHODS.map((m) => (
                  <option key={m.value || "tradicional"} value={m.value}>{m.label}</option>
                ))}
              </select>
              <p className="text-xs text-zinc-500 mt-1">Bi-set · Tri-set · Circuito</p>
            </div>
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
