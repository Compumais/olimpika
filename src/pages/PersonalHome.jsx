import { useQuery } from "@tanstack/react-query";
import { localApi } from "@/api/localApiClient";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { 
  Dumbbell, 
  Users, 
  Calendar,
  TrendingUp,
  Plus,
  Settings,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import OlimpikaLogo from "@/components/OlimpikaLogo";
import { useAuth } from "@/lib/AuthContext";

export default function PersonalHome() {
  const { user } = useAuth();

  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts'],
    queryFn: () => localApi.getWorkouts()
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercise-library'],
    queryFn: () => localApi.getTemplateExercises()
  });

  const stats = [
    { label: "Treinos Criados", value: workouts.length, icon: Dumbbell, color: "yellow" },
    { label: "Exercícios", value: exercises.length, icon: TrendingUp, color: "blue" },
    { label: "Alunos Ativos", value: "0", icon: Users, color: "green" }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-b border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <OlimpikaLogo size="sm" className="mb-2" />
            <h1 className="text-2xl font-bold">Olá, {user?.full_name?.split(' ')[0] || 'Personal'}! 💪</h1>
            <p className="text-zinc-500">Área do Personal Trainer</p>
          </div>
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" size="icon" className="text-zinc-400">
              <Settings className="w-6 h-6" />
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 text-center"
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 text-${stat.color}-400`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-zinc-500">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid gap-3">
          <Link to={createPageUrl('ManageStudents')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-black">Gerenciar Alunos</h3>
                  <p className="text-sm text-black/70">Adicionar e gerenciar alunos</p>
                </div>
              </div>
              <Plus className="w-6 h-6 text-black" />
            </motion.div>
          </Link>

          <Link to={createPageUrl('ExerciseLibrary')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Biblioteca de Exercícios</h3>
                  <p className="text-sm text-zinc-500">{exercises.length} exercícios cadastrados</p>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link to={createPageUrl('ListUsers')}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Users className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Usuários cadastrados</h3>
                  <p className="text-sm text-zinc-500">Listar todos os usuários</p>
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="px-6">
        <h2 className="text-lg font-semibold mb-4">Treinos Recentes</h2>
        {workouts.length === 0 ? (
          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-8 text-center">
            <Dumbbell className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 mb-4">Nenhum treino criado ainda</p>
            <Link to={createPageUrl('ManageWorkouts')}>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Treino
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.slice(0, 3).map((workout) => (
              <Link key={workout.id} to={createPageUrl('ManageExercises') + `?workoutId=${workout.id}`}>
                <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{workout.name}</h3>
                      <p className="text-sm text-zinc-500">{workout.short_name}</p>
                    </div>
                    <div className="text-yellow-400 text-2xl font-bold">{workout.short_name}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}