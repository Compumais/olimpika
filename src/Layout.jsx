import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Calendar, User, Dumbbell } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function Layout({ children, currentPageName }) {
  const { user } = useAuth();
  const pagesWithNav = ['Home', 'History', 'Profile', 'SelectWorkout', 'ManageWorkouts', 'ManageExercises'];
  const showNav = pagesWithNav.includes(currentPageName);

  const baseNavItems = [
    { icon: Home, label: 'Início', page: 'Home' },
    { icon: Dumbbell, label: 'Treinos', page: 'ManageWorkouts' },
    { icon: User, label: 'Perfil', page: 'Profile' },
  ];

  const historyItem = { icon: Calendar, label: 'Histórico', page: 'History' };
  const navItems = user?.user_type === 'aluno'
    ? [baseNavItems[0], historyItem, baseNavItems[1], baseNavItems[2]]
    : baseNavItems;

  return (
    <div className="min-h-screen bg-zinc-950">
      {children}

      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-800 px-4 py-2 z-50">
          <div className="flex justify-around items-center">
            {navItems.map(({ icon: Icon, label, page }) => {
              const isActive = currentPageName === page;
              return (
                <Link
                  key={page}
                  to={createPageUrl(page)}
                  className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
                    isActive 
                      ? 'text-yellow-400' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}