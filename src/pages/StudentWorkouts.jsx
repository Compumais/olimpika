import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2,
  Dumbbell,
  Link2,
  Unlink,
  User,
  Calendar,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { localApi } from "@/api/localApiClient";
import { useAuth } from "@/lib/AuthContext";

export default function StudentWorkouts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    short_name: "",
    description: "",
    color: "bg-blue-500",
    expires_at: "",
    training_method: ""
  });

  const TRAINING_METHODS = [
    { value: "", label: "Tradicional" },
    { value: "bi-set", label: "Bi-set" },
    { value: "tri-set", label: "Tri-set" },
    { value: "circuito", label: "Circuito" },
  ];
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [assignmentExpiresAt, setAssignmentExpiresAt] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [workoutToDelete, setWorkoutToDelete] = useState(null);
  const [assignmentToRemove, setAssignmentToRemove] = useState(null);
  const [newWorkoutDialogOpen, setNewWorkoutDialogOpen] = useState(false);
  const [newWorkoutStep, setNewWorkoutStep] = useState("choice"); // "choice" | "assign" | "create"

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get student info from URL
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get('student_id');
  const studentName = decodeURIComponent(urlParams.get('student_name') || 'Aluno');

  const { data: student, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => localApi.getStudent(studentId),
    enabled: !!studentId
  });

  const canManage = !student || student.personal_trainer_email === user?.email || user?.user_type === 'admin';

  useEffect(() => {
    if (student && !canManage) {
      navigate(createPageUrl('ManageStudents'));
    }
  }, [student, canManage, navigate]);

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['student-workouts', studentId],
    queryFn: () => localApi.getWorkouts({ student_id: studentId }),
    enabled: !!studentId && canManage
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["workout-templates"],
    queryFn: () => localApi.getWorkoutTemplates(),
    enabled: !!studentId,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["student-template-assignments", studentId],
    queryFn: () => localApi.getStudentTemplateAssignments(studentId),
    enabled: !!studentId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        student_id: studentId,
        created_by_id: user?.id,
        created_by: user?.email,
        created_date: new Date().toISOString(),
      };
      if (data.expires_at) payload.expires_at = data.expires_at;
      if (data.training_method) payload.training_method = data.training_method;
      return localApi.createWorkout(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-workouts'] });
      handleCloseDialog();
      setNewWorkoutDialogOpen(false);
      setNewWorkoutStep("choice");
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
      queryClient.invalidateQueries({ queryKey: ['student-workouts', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student-template-assignments', studentId] });
    }
  });

  const assignTemplateMutation = useMutation({
    mutationFn: (templateId) => localApi.assignWorkoutTemplate(studentId, templateId, user, "", assignmentExpiresAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-template-assignments", studentId] });
      queryClient.invalidateQueries({ queryKey: ["student-workouts", studentId] });
      setSelectedTemplateId("");
      setAssignmentExpiresAt("");
      setAssignmentError("");
      setNewWorkoutDialogOpen(false);
      setNewWorkoutStep("choice");
    },
    onError: (err) => setAssignmentError(err?.message ?? "Erro ao atribuir template."),
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: (assignmentId) => localApi.removeStudentTemplateAssignment(studentId, assignmentId, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-template-assignments", studentId] });
      queryClient.invalidateQueries({ queryKey: ["student-workouts", studentId] });
      setAssignmentToRemove(null);
    },
    onError: (err) => setAssignmentError(err?.message ?? "Erro ao remover template."),
  });

  const handleOpenDialog = (workout = null) => {
    if (workout) {
      setEditingWorkout(workout);
      setFormData({
        name: workout.name || "",
        short_name: workout.short_name || "",
        description: workout.description || "",
        color: workout.color || "bg-blue-500",
        expires_at: workout.expires_at || "",
        training_method: workout.training_method || ""
      });
      setDialogOpen(true);
    } else {
      setNewWorkoutStep("choice");
      setNewWorkoutDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingWorkout(null);
  };

  const handleCloseNewWorkoutDialog = () => {
    setNewWorkoutDialogOpen(false);
    setNewWorkoutStep("choice");
    setAssignmentError("");
    setSelectedTemplateId("");
    setAssignmentExpiresAt("");
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.short_name) return;

    if (editingWorkout) {
      updateMutation.mutate({ id: editingWorkout.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return iso;
    }
  };

  const assignableTemplates = templates.filter((template) => !assignments.some((a) => a.template_id === template.id));
  const allWorkouts = [...workouts];
  const totalCount = allWorkouts.length;

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
              <p className="text-sm text-zinc-500">{totalCount} treino(s)</p>
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

      {/* Workouts List - unified */}
      <div className="px-4 py-6">
        {isLoading ? (
          <div className="text-center py-12 text-zinc-500">Carregando...</div>
        ) : allWorkouts.length === 0 ? (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-12 text-center">
            <Dumbbell className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum treino</h3>
            <p className="text-zinc-500 mb-6">Clique em Novo Treino para atribuir um template ou criar um treino para {studentName}</p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Treino
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {allWorkouts.map((workout, index) => {
              const isTemplate = workout.is_template_assignment;
              const personal = isTemplate ? workout.assigned_by : workout.created_by;
              const createdDate = isTemplate ? workout.assigned_date : workout.created_date;

              return (
                <motion.div
                  key={workout.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden"
                >
                  <div className={`h-2 ${workout.color || "bg-zinc-600"}`} />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`px-3 py-1 rounded-full ${workout.color || "bg-zinc-600"} text-white text-sm font-bold`}>
                            {workout.short_name || (isTemplate ? "TMP" : "—")}
                          </span>
                          {isTemplate && (
                            <span className="px-2 py-0.5 rounded bg-zinc-700 text-zinc-300 text-xs">Template</span>
                          )}
                          <h3 className="font-semibold text-lg">{workout.name}</h3>
                        </div>
                        {workout.description && (
                          <p className="text-zinc-400 text-sm">{workout.description}</p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 mt-2">
                          {workout.training_method && (
                            <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                              {workout.training_method === "bi-set" ? "Bi-set" : workout.training_method === "tri-set" ? "Tri-set" : workout.training_method === "circuito" ? "Circuito" : workout.training_method}
                            </span>
                          )}
                          {personal && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Personal: {personal}
                            </span>
                          )}
                          {createdDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Criado: {formatDate(createdDate)}
                            </span>
                          )}
                          {workout.expires_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Vencimento: {formatDate(workout.expires_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={
                          isTemplate
                            ? createPageUrl('TemplateExercises') + `?template_id=${workout.template_id}`
                            : createPageUrl('ManageExercises') + `?workout_id=${workout.id}`
                        }
                        className="flex-1"
                      >
                        <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black">
                          <Dumbbell className="w-4 h-4 mr-2" />
                          Gerenciar Exercícios
                        </Button>
                      </Link>
                      {isTemplate ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAssignmentToRemove(workout)}
                          className="text-zinc-400 hover:text-red-400"
                        >
                          <Unlink className="w-4 h-4 mr-2" />
                          Remover
                        </Button>
                      ) : (
                        <>
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
                            onClick={() => setWorkoutToDelete(workout)}
                            className="text-zinc-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Novo Treino - choice / assign / create */}
      <Dialog open={newWorkoutDialogOpen} onOpenChange={(open) => !open && handleCloseNewWorkoutDialog()}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {newWorkoutStep === "choice" && "Novo Treino"}
              {newWorkoutStep === "assign" && "Atribuir template"}
              {newWorkoutStep === "create" && "Criar treino"}
            </DialogTitle>
          </DialogHeader>

          {newWorkoutStep === "choice" && (
            <div className="py-4 space-y-3">
              <p className="text-zinc-400 text-sm">Como deseja adicionar o treino?</p>
              <div className="grid gap-2">
                <Button
                  onClick={() => setNewWorkoutStep("assign")}
                  className="h-14 justify-start bg-yellow-500 hover:bg-yellow-600 text-black"
                  disabled={assignableTemplates.length === 0}
                >
                  <Link2 className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <span className="font-medium">Atribuir template</span>
                    <p className="text-xs text-black/70 mt-0.5">
                      {assignableTemplates.length > 0
                        ? "Vincular um template existente (alterações refletem para o aluno)"
                        : "Todos os templates já estão atribuídos"}
                    </p>
                  </div>
                </Button>
                <Button
                  onClick={() => {
                    setNewWorkoutStep("create");
                    setEditingWorkout(null);
                    setFormData({ name: "", short_name: "", description: "", color: "bg-blue-500", expires_at: "", training_method: "" });
                    setDialogOpen(true);
                    handleCloseNewWorkoutDialog();
                  }}
                  className="h-14 justify-start bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  <Plus className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <span className="font-medium">Criar novo treino</span>
                    <p className="text-xs text-black/70 mt-0.5">Criar treino personalizado do zero</p>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {newWorkoutStep === "assign" && (
            <div className="py-4 space-y-4">
              {assignmentError && <p className="text-sm text-red-400">{assignmentError}</p>}
              <div>
                <Label>Template</Label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="mt-2 w-full h-10 rounded-md bg-zinc-800 border border-zinc-700 px-3 text-sm"
                >
                  <option value="">Selecione um template</option>
                  {assignableTemplates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.short_name || "TMP"})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Data de vencimento (opcional)</Label>
                <Input
                  type="date"
                  value={assignmentExpiresAt}
                  onChange={(e) => setAssignmentExpiresAt(e.target.value)}
                  className="mt-2 bg-zinc-800 border-zinc-700"
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={() => setNewWorkoutStep("choice")}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => assignTemplateMutation.mutate(selectedTemplateId)}
                  disabled={!selectedTemplateId || assignTemplateMutation.isPending}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  {assignTemplateMutation.isPending ? "Atribuindo..." : "Atribuir"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove assignment confirmation */}
      <AlertDialog open={!!assignmentToRemove} onOpenChange={(open) => !open && setAssignmentToRemove(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover vínculo do template</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Tem certeza que deseja remover o vínculo do template &quot;{assignmentToRemove?.name}&quot; deste aluno?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-yellow-500 hover:bg-yellow-600 text-black border-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (assignmentToRemove) {
                  const id = assignmentToRemove.assignment_id;
                  setAssignmentToRemove(null);
                  removeAssignmentMutation.mutate(id);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!workoutToDelete} onOpenChange={(open) => !open && setWorkoutToDelete(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir treino</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Tem certeza que deseja excluir o treino &quot;{workoutToDelete?.name}&quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-yellow-500 hover:bg-yellow-600 text-black border-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (workoutToDelete) {
                  const id = workoutToDelete.id;
                  setWorkoutToDelete(null);
                  deleteMutation.mutate(id);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              <Label>Data de Vencimento (opcional)</Label>
              <Input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
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
              <p className="text-xs text-zinc-500 mt-1">Bi-set: 2 exercícios juntos · Tri-set: 3 juntos · Circuito: sequência</p>
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