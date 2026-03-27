import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Check, Weight, Repeat, Timer, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export default function ExerciseCard({ exercise, index, onComplete, isCompleted }) {
  const [expanded, setExpanded] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`rounded-2xl overflow-hidden border transition-all duration-300 ${
          isCompleted 
            ? "bg-yellow-500/10 border-yellow-500/30" 
            : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
        }`}
      >
        {/* Image/Video Section */}
        <div className="relative h-48 bg-zinc-800 overflow-hidden group">
          {exercise.image_url ? (
            <img 
              src={exercise.image_url} 
              alt={exercise.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
              <Weight className="w-16 h-16 text-zinc-700" />
            </div>
          )}
          
          {/* Video Play Button */}
          {exercise.video_url && (
            <button
              onClick={() => setVideoOpen(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
            </button>
          )}

          {/* Exercise Number Badge */}
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm">
            <span className="text-sm font-bold text-white">#{index + 1}</span>
          </div>

          {/* Completed Badge */}
          {isCompleted && (
            <div className="absolute top-3 right-3 p-2 rounded-full bg-yellow-500">
              <Check className="w-4 h-4 text-black" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-white mb-3">{exercise.name}</h3>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
              <Repeat className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <p className="text-xs text-zinc-500">Séries</p>
              <p className="text-lg font-bold text-white">{exercise.sets}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
              <span className="text-yellow-400 text-sm font-bold">REP</span>
              <p className="text-xs text-zinc-500">Repetições</p>
              <p className="text-lg font-bold text-white">{exercise.reps}</p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
              <Weight className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <p className="text-xs text-zinc-500">Carga</p>
              <p className="text-lg font-bold text-white">{exercise.weight || "-"}</p>
            </div>
          </div>

          {/* Rest Time */}
          {exercise.rest_seconds && (
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-4">
              <Timer className="w-4 h-4" />
              <span>Descanso: {exercise.rest_seconds}s entre séries</span>
            </div>
          )}

          {/* Description Toggle */}
          {exercise.description && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-yellow-400 text-sm font-medium w-full"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {expanded ? "Ocultar instruções" : "Ver instruções"}
            </button>
          )}

          <AnimatePresence>
            {expanded && exercise.description && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-zinc-400 text-sm mt-3 leading-relaxed">
                  {exercise.description}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Complete Button */}
          <Button
            onClick={() => onComplete(exercise)}
            className={`w-full mt-4 rounded-xl h-12 font-semibold transition-all ${
              isCompleted
                ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                : "bg-yellow-500 hover:bg-yellow-600 text-black"
            }`}
          >
            {isCompleted ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Concluído
              </>
            ) : (
              "Marcar como concluído"
            )}
          </Button>
        </div>
      </motion.div>

      {/* Video Dialog */}
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">{exercise.name} - Vídeo</DialogTitle>
          <div className="relative">
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {exercise.video_url && (
              <div className="bg-zinc-950">
                {exercise.video_url.includes('youtube.com') || exercise.video_url.includes('youtu.be') ? (
                  <iframe
                    src={exercise.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    className="w-full aspect-video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : exercise.video_url.includes('vimeo.com') ? (
                  <iframe
                    src={exercise.video_url.replace('vimeo.com/', 'player.vimeo.com/video/')}
                    className="w-full aspect-video"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={exercise.video_url}
                    controls
                    autoPlay
                    className="w-full aspect-video"
                  />
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}