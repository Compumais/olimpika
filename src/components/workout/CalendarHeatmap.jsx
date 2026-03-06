import { useMemo } from "react";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay, addDays, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarHeatmap({ sessions, currentMonth, onMonthChange }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const calendarDays = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPadding = getDay(monthStart);
    const paddedDays = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startPadding; i++) {
      paddedDays.push(null);
    }
    
    return [...paddedDays, ...days];
  }, [monthStart, monthEnd]);

  const getSessionsForDay = (date) => {
    if (!date) return [];
    return sessions.filter(session => 
      isSameDay(new Date(session.date), date) && session.status === 'completed'
    );
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-zinc-400" />
        </button>
        
        <h3 className="text-lg font-bold text-white capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        
        <button
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs text-zinc-500 font-medium py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const daySessions = getSessionsForDay(day);
          const hasWorkout = daySessions.length > 0;
          const isCurrentDay = isToday(day);

          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all ${
                hasWorkout 
                  ? "bg-yellow-500/20 border border-yellow-500/30" 
                  : "bg-zinc-800/30 hover:bg-zinc-800/50"
              } ${isCurrentDay ? "ring-2 ring-yellow-400" : ""}`}
            >
              <span className={`text-sm font-medium ${
                hasWorkout ? "text-yellow-400" : "text-zinc-400"
              }`}>
                {format(day, 'd')}
              </span>
              {hasWorkout && (
                <div className="flex gap-0.5 mt-1">
                  {daySessions.slice(0, 3).map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-yellow-400" />
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}