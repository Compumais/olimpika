import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  X,
  Trophy,
  Dumbbell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import ExerciseCard from "@/components/workout/ExerciseCard";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuth } from "@/lib/AuthContext";
import { localApi } from "@/api/localApiClient";

export default function ActiveWorkout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const workoutId = urlParams.get('workout_id');

  const [session, setSession] = useState(null);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [weightOverrides, setWeightOverrides] = useState({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { user } = useAuth();
  const isTemplateWorkout = workoutId?.startsWith?.("template:");

  const { data: workout, isLoading: loadingWorkout } = useQuery({
    queryKey: ['workout', workoutId],
    queryFn: () => workoutId ? localApi.getWorkoutById(workoutId) : null,
    enabled: !!workoutId
  });

  const { data: exercises = [], isLoading: loadingExercises } = useQuery({
    queryKey: ['exercises', workoutId],
    queryFn: () => localApi.getExercisesByWorkoutId(workoutId),
    enabled: !!workoutId
  });

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Create session on mount
  useEffect(() => {
    const createSession = async () => {
      if (!user?.email || !workout || session) return;
      
      const newSession = await localApi.createWorkoutSession({
        user_email: user.email,
        workout_id: workoutId,
        workout_name: workout.name,
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: format(new Date(), 'HH:mm'),
        status: 'in_progress',
        exercises_completed: []
      });
      setSession(newSession);
    };
    createSession();
  }, [user, workout, workoutId, session]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteExercise = (exercise) => {
    if (completedExercises.includes(exercise.id)) {
      setCompletedExercises(prev => prev.filter(id => id !== exercise.id));
    } else {
      setCompletedExercises(prev => [...prev, exercise.id]);
    }
  };

  const handleCompleteGroup = (groupExercises) => {
    const ids = groupExercises.map((e) => e.id);
    const allComplete = ids.every((id) => completedExercises.includes(id));
    if (allComplete) {
      setCompletedExercises((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setCompletedExercises((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const handleWeightChange = (exerciseId, weight) => {
    setWeightOverrides((prev) => {
      const next = { ...prev };
      if (weight === null || weight === "") {
        delete next[exerciseId];
      } else {
        next[exerciseId] = weight;
      }
      return next;
    });
    if (!isTemplateWorkout && weight !== undefined) {
      updateWeightMutation.mutate({ id: exerciseId, weight: weight || null });
    }
  };

  const updateWeightMutation = useMutation({
    mutationFn: ({ id, weight }) => localApi.updateExercise(id, { weight: weight || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises", workoutId] });
    },
  });

  const finishWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        throw new Error('Sessão ainda não foi criada. Aguarde um momento e tente novamente.');
      }
      
      const exercisesData = completedExercises.map(exId => {
        const ex = exercises.find(e => e.id === exId);
        const weightUsed = weightOverrides[exId] ?? ex?.weight ?? null;
        return {
          exercise_id: exId,
          exercise_name: ex?.name,
          sets_completed: ex?.sets,
          weight_used: weightUsed
        };
      });

      await localApi.updateWorkoutSession(session.id, {
        status: 'completed',
        end_time: format(new Date(), 'HH:mm'),
        duration_minutes: String(Math.round(elapsedTime / 60)),
        exercises_completed: JSON.stringify(exercisesData)
      });
    },
    onSuccess: () => {
      setShowFinishDialog(false);
      queryClient.invalidateQueries({ queryKey: ['sessions', user?.email] });
      navigate(createPageUrl('Home'));
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar',
        description: error?.message || 'Não foi possível salvar o treino. Tente novamente.',
        variant: 'destructive',
      });
    }
  });

  const cancelWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!session) return;
      await localApi.updateWorkoutSession(session.id, {
        status: 'cancelled'
      });
    },
    onSuccess: () => {
      navigate(createPageUrl('Home'));
    }
  });

  const progress = exercises.length > 0 
    ? Math.round((completedExercises.length / exercises.length) * 100)
    : 0;

  const hasMethodGroups = ["bi-set", "tri-set", "circuito"].includes(workout?.training_method || "");
  const groupedExercises = hasMethodGroups
    ? (() => {
        const groups = {};
        exercises.forEach((ex) => {
          const g = ex.method_group ?? 0;
          if (!groups[g]) groups[g] = [];
          groups[g].push(ex);
        });
        return Object.keys(groups).map(Number).sort((a, b) => a - b).map((gKey) => ({
          key: gKey,
          label: gKey === 0 ? null : `Grupo ${gKey}`,
          exercises: groups[gKey],
        }));
      })()
    : [{ key: 0, label: null, exercises }];

  if (loadingWorkout || loadingExercises) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-5">
        <Skeleton className="h-8 w-48 bg-zinc-800 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-72 rounded-2xl bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={() => setShowCancelDialog(true)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="font-mono font-bold">{formatTime(elapsedTime)}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{workout?.name}</h1>
              {hasMethodGroups && (
                <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                  {workout?.training_method === "bi-set" ? "Bi-set" : workout?.training_method === "tri-set" ? "Tri-set" : "Circuito"}
                </span>
              )}
            </div>
            <p className="text-zinc-400 text-sm">
              {completedExercises.length} de {exercises.length} exercícios
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-yellow-500"
            />
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="px-5 py-6 space-y-4">
        {groupedExercises.map((group, groupIndex) => {
          const isCombinedGroup = !!group.label;
          const groupIds = group.exercises.map((e) => e.id);
          const groupAllComplete = isCombinedGroup && groupIds.every((id) => completedExercises.includes(id));
          return (
            <div key={group.key} className="space-y-3">
              {group.label && (
                <div className="px-3 py-2 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-sm font-medium">
                  {group.label} — executar combinadamente
                </div>
              )}
              {group.exercises.map((exercise, idx) => {
                const globalIndex = groupedExercises.slice(0, groupIndex).reduce((acc, g) => acc + g.exercises.length, 0) + idx;
                return (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    index={globalIndex}
                    isCompleted={completedExercises.includes(exercise.id)}
                    onComplete={handleCompleteExercise}
                    hideCompleteButton={isCombinedGroup}
                    weightOverride={weightOverrides[exercise.id]}
                    onWeightChange={handleWeightChange}
                  />
                );
              })}
              {isCombinedGroup && (
                <Button
                  onClick={() => handleCompleteGroup(group.exercises)}
                  className={`w-full rounded-xl h-12 font-semibold ${
                    groupAllComplete
                      ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                      : "bg-yellow-500 hover:bg-yellow-600 text-black"
                  }`}
                >
                  {groupAllComplete ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Grupo concluído
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Concluir grupo
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Finish Button */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
        <Button
          onClick={() => setShowFinishDialog(true)}
          disabled={completedExercises.length === 0}
          className="w-full h-14 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-6 h-6 mr-2" />
          Finalizar Treino
        </Button>
      </div>

      {/* Finish Dialog */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <DialogTitle className="text-center text-xl">Finalizar Treino?</DialogTitle>
            <DialogDescription className="text-center text-zinc-400">
              Você completou {completedExercises.length} de {exercises.length} exercícios
              em {formatTime(elapsedTime)}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => setShowFinishDialog(false)}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Voltar
            </Button>
            <Button
              onClick={() => finishWorkoutMutation.mutate()}
              disabled={!session || finishWorkoutMutation.isPending}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black disabled:opacity-50"
            >
              {!session ? "Aguarde..." : finishWorkoutMutation.isPending ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <DialogTitle className="text-center text-xl">Cancelar Treino?</DialogTitle>
            <DialogDescription className="text-center text-zinc-400">
              Seu progresso não será salvo. Tem certeza que deseja sair?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => setShowCancelDialog(false)}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Continuar treino
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelWorkoutMutation.mutate()}
              disabled={cancelWorkoutMutation.isPending}
              className="flex-1"
            >
              {cancelWorkoutMutation.isPending ? "Cancelando..." : "Sair"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}