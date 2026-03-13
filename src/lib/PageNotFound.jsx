import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1) || '(início)';
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.user_type === 'admin';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950 text-white">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-light text-zinc-600">404</h1>
          <div className="h-0.5 w-16 bg-zinc-700 mx-auto" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-medium">Página não encontrada</h2>
          <p className="text-zinc-400 leading-relaxed">
            A rota <span className="font-medium text-zinc-300">&quot;{pageName}&quot;</span> não existe neste app.
          </p>
        </div>
        {isAuthenticated && isAdmin && (
          <div className="mt-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800 text-left text-sm text-zinc-400">
            <p className="font-medium text-zinc-300 mb-1">Admin</p>
            <p>Se faltar uma tela, adicione o componente em <code className="text-yellow-500">src/pages</code> e registre em <code className="text-yellow-500">pages.config.js</code>.</p>
          </div>
        )}
        <div className="pt-4">
          <Link
            to={createPageUrl('Home')}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-yellow-500 text-black hover:bg-yellow-400"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
