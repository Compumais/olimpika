import { motion } from "framer-motion";
import { Clock, Dumbbell, ChevronRight } from "lucide-react";

export default function WorkoutCard({ workout, onClick, index }) {
  const colors = [
    "from-yellow-600 to-yellow-800",
    "from-amber-600 to-amber-800",
    "from-orange-600 to-orange-800",
    "from-yellow-500 to-amber-700",
    "from-amber-500 to-orange-700"
  ];

  const bgColor = colors[index % colors.length];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bgColor} p-5 cursor-pointer group`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <span className="text-xl font-black text-white">{workout.short_name}</span>
          </div>
          <ChevronRight className="w-6 h-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </div>
        
        <h3 className="text-lg font-bold text-white mb-2">{workout.name}</h3>
        
        <div className="flex items-center gap-4 text-white/70 text-sm">
          {workout.estimated_duration && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{workout.estimated_duration} min</span>
            </div>
          )}
          {workout.muscle_groups?.length > 0 && (
            <div className="flex items-center gap-1">
              <Dumbbell className="w-4 h-4" />
              <span>{workout.muscle_groups.length} grupos</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}