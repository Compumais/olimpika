import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { User, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SetupProfile() {
  const [selectedType, setSelectedType] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!selectedType) return;

    setSaving(true);
    try {
      await base44.auth.updateMe({ user_type: selectedType });
      
      // Redireciona para o dashboard correto
      if (selectedType === 'personal') {
        navigate(createPageUrl('PersonalHome'));
      } else {
        navigate(createPageUrl('Home'));
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setSaving(false);
    }
  };

  const userTypes = [
    {
      type: "aluno",
      icon: User,
      title: "Sou Aluno",
      description: "Quero acompanhar meus treinos e evolução",
      color: "from-blue-500 to-blue-600"
    },
    {
      type: "personal",
      icon: Users,
      title: "Sou Personal Trainer",
      description: "Quero gerenciar treinos e alunos",
      color: "from-yellow-500 to-yellow-600"
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo!</h1>
          <p className="text-zinc-400">Primeiro, nos conte quem você é</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {userTypes.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedType === item.type;

            return (
              <motion.button
                key={item.type}
                onClick={() => setSelectedType(item.type)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? "border-yellow-500 bg-yellow-500/10"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-400">{item.description}</p>
              </motion.button>
            );
          })}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!selectedType || saving}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black h-12 rounded-xl font-semibold disabled:opacity-50"
        >
          {saving ? "Salvando..." : (
            <>
              Continuar
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}