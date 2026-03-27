import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Plus, 
  User,
  ChevronRight,
  Search,
  Dumbbell,
  UserCircle,
  Calendar,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/lib/AuthContext";
import { localApi } from "@/api/localApiClient";

export default function ManageStudents() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    goal: "",
    notes: ""
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => localApi.getStudents({}),
    enabled: !!user
  });

  const [createError, setCreateError] = useState("");
  const [adoptError, setAdoptError] = useState("");

  const adoptMutation = useMutation({
    mutationFn: (studentId) =>
      localApi.updateStudent(studentId, { personal_trainer_email: user?.email ?? "" }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['students'] });
      setAdoptError("");
    },
    onError: (err) => {
      setAdoptError(err?.message ?? "Erro ao adotar aluno.");
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      localApi.createStudent({
        ...data,
        personal_trainer_email: user?.email ?? "",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setCreateError("");
      handleCloseDialog();
    },
    onError: (err) => {
      setCreateError(err?.message ?? "Erro ao cadastrar aluno.");
    }
  });

  const handleOpenDialog = () => {
    setFormData({ name: "", email: "", phone: "", goal: "", notes: "" });
    setCreateError("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCreateError("");
  };

  const handleSubmit = () => {
    const name = (formData.name || "").trim();
    const email = (formData.email || "").trim().toLowerCase();
    if (!name || !email) return;
    createMutation.mutate({ ...formData, name, email });
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (iso) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('PersonalHome')}>
              <Button variant="ghost" size="icon" className="text-zinc-400">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Alunos</h1>
              <p className="text-sm text-zinc-500">{students.length} cadastrado(s) — selecione para definir o treino</p>
            </div>
          </div>
          <Button
            onClick={handleOpenDialog}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            <Plus className="w-5 h-5 mr-2" />
            Cadastrar aluno
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <Input
            placeholder="Buscar aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-zinc-900 border-zinc-800 pl-10 text-white"
          />
        </div>
      </div>

      {adoptError && (
        <div className="mx-4 mb-2 p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
          {adoptError}
        </div>
      )}

      {/* Students List */}
      <div className="px-4">
        {isLoading ? (
          <div className="text-center py-12 text-zinc-500">Carregando...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-12 text-center">
            <User className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
            </h3>
            <p className="text-zinc-500 mb-6">
              {searchTerm ? "Tente buscar por outro nome" : "Os alunos aparecem aqui após se cadastrarem ou quando você cadastra um novo aluno"}
            </p>
            {!searchTerm && (
              <Button
                onClick={handleOpenDialog}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                <Plus className="w-5 h-5 mr-2" />
                Cadastrar aluno
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredStudents.map((student, index) => {
              const isAdoptedByMe = student.personal_trainer_email === user?.email;
              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => isAdoptedByMe && navigate(createPageUrl('StudentWorkouts') + `?student_id=${student.id}&student_name=${encodeURIComponent(student.name)}`)}
                  className={`bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 transition-all ${
                    isAdoptedByMe ? "hover:bg-zinc-800/50 cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-yellow-500/20 border-2 border-yellow-500/30 flex items-center justify-center flex-shrink-0">
                      <User className="w-7 h-7 text-yellow-400" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-lg">{student.name}</h3>
                      {student.goal && (
                        <p className="text-sm text-yellow-400">{student.goal}</p>
                      )}
                      <div className="flex gap-3 text-xs text-zinc-500 mt-1">
                        {student.email && <span>{student.email}</span>}
                        {student.phone && (
                          <>
                            {student.email && <span>•</span>}
                            <span>{student.phone}</span>
                          </>
                        )}
                      </div>
                      {(student.workout_assigned_by || student.next_expires_at) && isAdoptedByMe && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 mt-2">
                          {student.workout_assigned_by && (
                            <span className="flex items-center gap-1">
                              <UserCircle className="w-3.5 h-3.5" />
                              Personal: {student.workout_assigned_by}
                            </span>
                          )}
                          {student.next_expires_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              Renovar em: {formatDate(student.next_expires_at)}
                            </span>
                          )}
                        </div>
                      )}
                      {!isAdoptedByMe && student.personal_trainer_email && (
                        <p className="text-xs text-zinc-500 mt-2">
                          Adotado por outro personal
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {isAdoptedByMe ? (
                        <div className="text-center">
                          <Dumbbell className="w-5 h-5 text-zinc-500 mx-auto" />
                          <span className="text-xs text-zinc-500">Treinos</span>
                          <ChevronRight className="w-5 h-5 text-zinc-600 ml-1" />
                        </div>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            adoptMutation.mutate(student.id);
                          }}
                          disabled={adoptMutation.isPending}
                          className="bg-yellow-500 hover:bg-yellow-600 text-black"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {adoptMutation.isPending ? "Adotando..." : "Adotar aluno"}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Student Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Aluno</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nome do Aluno *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: João Silva"
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
              />
            </div>

            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
              />
            </div>

            <div>
              <Label>Objetivo</Label>
              <Input
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                placeholder="Ex: Ganhar massa muscular"
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
              />
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Anotações sobre o aluno..."
                className="bg-zinc-800 border-zinc-700 text-white min-h-24 mt-1"
              />
            </div>

            {createError && (
              <p className="text-sm text-red-400">{createError}</p>
            )}
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
              disabled={!formData.name?.trim() || !formData.email?.trim() || createMutation.isPending}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {createMutation.isPending ? "Salvando..." : "Cadastrar aluno"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}