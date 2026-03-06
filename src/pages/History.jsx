import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { localApi } from "@/api/localApiClient";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft, Dumbbell, Clock, Trophy } from "lucide-react";
import CalendarHeatmap from "@/components/workout/CalendarHeatmap";
import { format, isThisMonth, isThisWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/lib/AuthContext";

export default function History() {
  const [user, setUser] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { user: authUser } = useAuth();

  useEffect(() => {
    setUser(authUser || null);
  }, [authUser]);

  // Personal não tem histórico; mostra mensagem simples
  if (authUser && authUser.user_type === 'personal') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white pb-24">
        <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
          <div className="px-5 py-4 flex items-center gap-4">
            <Link to={createPageUrl('PersonalHome')}>
              <button className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <h1 className="text-xl font-bold">Histórico</h1>
          </div>
        </div>
        <div className="px-5 py-8">
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-8 text-center">
            <Dumbbell className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-300 font-medium mb-2">
              Histórico de treinos é exibido apenas para alunos.
            </p>
            <p className="text-zinc-500 text-sm">
              Use a área de gerenciamento de treinos para acompanhar seus alunos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', user?.email],
    queryFn: () => localApi.getWorkoutSessionsByUserEmail(user?.email),
    enabled: !!user?.email
  });

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const thisMonthSessions = completedSessions.filter(s => isThisMonth(new Date(s.date)));
  const thisWeekSessions = completedSessions.filter(s => isThisWeek(new Date(s.date)));

  const totalMinutes = completedSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="px-5 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <button className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-xl font-bold">Histórico</h1>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 text-center">
            <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{completedSessions.length}</p>
            <p className="text-xs text-zinc-500">Total</p>
          </div>
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 text-center">
            <Dumbbell className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{thisMonthSessions.length}</p>
            <p className="text-xs text-zinc-500">Este mês</p>
          </div>
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 text-center">
            <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalHours}h</p>
            <p className="text-xs text-zinc-500">Treinando</p>
          </div>
        </div>

        {/* Calendar */}
        <div className="mb-6">
          <CalendarHeatmap 
            sessions={completedSessions}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        </div>

        {/* Session List */}
        <div>
          <h3 className="text-lg font-bold mb-4">Treinos Realizados</h3>
          
          {completedSessions.length === 0 ? (
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-8 text-center">
              <Dumbbell className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">Nenhum treino registrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{session.workout_name}</h4>
                      <p className="text-zinc-500 text-sm">
                        {format(new Date(session.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right">
                      {session.duration_minutes && (
                        <p className="text-yellow-400 font-semibold">{session.duration_minutes} min</p>
                      )}
                      {session.exercises_completed?.length > 0 && (
                        <p className="text-zinc-500 text-sm">
                          {session.exercises_completed.length} exercícios
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}