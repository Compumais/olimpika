import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft, Plus } from "lucide-react";
import WorkoutCard from "@/components/workout/WorkoutCard";
import { Skeleton } from "@/components/ui/skeleton";
import { localApi } from "@/api/localApiClient";
import { useAuth } from "@/lib/AuthContext";

export default function SelectWorkout() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['workouts', user?.user_type, user?.student_id],
    queryFn: () => {
      if (user?.user_type === 'aluno' && user?.student_id) {
        return localApi.getWorkouts({ student_id: user.student_id });
      }
      return localApi.getWorkouts();
    },
    enabled: !!user,
  });

  const handleSelectWorkout = (workout) => {
    navigate(createPageUrl(`ActiveWorkout?workout_id=${workout.id}`));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="px-5 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <button className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-xl font-bold">Selecionar Treino</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6">
        <p className="text-zinc-400 mb-6">
          Escolha o treino que deseja realizar hoje:
        </p>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl bg-zinc-800" />
            ))}
          </div>
        ) : workouts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum treino disponível</h3>
            <p className="text-zinc-500 mb-6">
              {user?.user_type === 'aluno'
                ? 'Seu personal ainda não cadastrou treinos para você. Peça para ele criar e vincular treinos ao seu perfil.'
                : 'Crie seu primeiro treino para começar'}
            </p>
            {user?.user_type !== 'aluno' && (
              <Link to={createPageUrl('ManageWorkouts')}>
                <button className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl font-semibold transition-colors">
                  Criar Treino
                </button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout, index) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                index={index}
                onClick={() => handleSelectWorkout(workout)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}