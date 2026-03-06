import { motion } from "framer-motion";

export default function StatsCard({ icon: Icon, label, value, color = "emerald" }) {
  const colorClasses = {
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border ${colorClasses[color]} p-4 backdrop-blur-sm`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}