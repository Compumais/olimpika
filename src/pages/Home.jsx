import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { localApi } from "@/api/localApiClient";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { 
  Play, 
  Calendar, 
  Trophy, 
  Flame, 
  TrendingUp,
  User,
  Dumbbell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/workout/StatsCard";
import OlimpikaLogo from "@/components/OlimpikaLogo";
import { format, isThisMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/lib/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Redireciona personal para sua área
    if (user.user_type === 'personal') {
      navigate(createPageUrl('PersonalHome'), { replace: true });
    }
  }, [user, navigate]);

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', user?.email],
    queryFn: () => localApi.getWorkoutSessionsByUserEmail(user?.email),
    enabled: !!user?.email
  });

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const thisMonthSessions = completedSessions.filter(s => 
    isThisMonth(new Date(s.date))
  );

  // Calculate streak
  const calculateStreak = () => {
    if (completedSessions.length === 0) return 0;
    
    const sortedDates = [...new Set(
      completedSessions.map(s => format(new Date(s.date), 'yyyy-MM-dd'))
    )].sort().reverse();
    
    let streak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    
    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) return 0;
    
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = format(new Date(Date.now() - (i * 86400000)), 'yyyy-MM-dd');
      if (sortedDates.includes(expectedDate)) {
        streak++;
      } else if (i === 0 && sortedDates.includes(yesterday)) {
        continue;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative px-5 pt-12 pb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <OlimpikaLogo size="sm" className="mb-2 opacity-90" />
              <p className="text-zinc-400 text-sm">Olá,</p>
              <h1 className="text-2xl font-bold">{user?.full_name || 'Atleta'}</h1>
            </div>
            <Link to={createPageUrl('Profile')}>
              <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-yellow-500 flex items-center justify-center overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-zinc-400" />
                )}
              </div>
            </Link>
          </div>

          {/* Start Workout CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <Link to={createPageUrl('SelectWorkout')}>
              <div className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl p-6 cursor-pointer group hover:shadow-lg hover:shadow-yellow-500/20 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-1 text-black">Iniciar Treino</h2>
                    <p className="text-black/80 text-sm">
                      {thisMonthSessions.length} treinos este mês
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-black/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 text-black fill-black ml-1" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 -mt-2">
        <div className="grid grid-cols-2 gap-3 mb-8">
          <StatsCard 
            icon={Flame}
            label="Sequência"
            value={`${streak} dias`}
            color="orange"
          />
          <StatsCard 
            icon={Trophy}
            label="Total"
            value={completedSessions.length}
            color="amber"
          />
          <StatsCard 
            icon={Calendar}
            label="Este mês"
            value={thisMonthSessions.length}
            color="yellow"
          />
          <StatsCard 
            icon={TrendingUp}
            label="Média/semana"
            value={(thisMonthSessions.length / 4).toFixed(1)}
            color="yellow"
          />
        </div>

        {/* Recent Activity */}
        {user.user_type === 'aluno' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Atividade Recente</h3>
              <Link to={createPageUrl('History')} className="text-yellow-400 text-sm font-medium">
                Ver tudo
              </Link>
            </div>

          {completedSessions.length === 0 ? (
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-8 text-center">
              <Dumbbell className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">Nenhum treino registrado</p>
              <p className="text-zinc-600 text-sm">Comece seu primeiro treino hoje!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedSessions.slice(0, 5).map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{session.workout_name}</h4>
                    <p className="text-zinc-500 text-sm">
                      {format(new Date(session.date), "dd 'de' MMMM", { locale: ptBR })}
                      {session.duration_minutes && ` • ${session.duration_minutes} min`}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}