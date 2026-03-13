import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, User, Mail, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { localApi } from "@/api/localApiClient";

export default function ListUsers() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => localApi.getUsers(),
  });

  const typeLabel = (type) => {
    if (type === "admin") return "Admin";
    if (type === "personal") return "Personal";
    return "Aluno";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      <div className="sticky top-0 z-40 bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="flex items-center justify-between p-4">
          <Link to={createPageUrl("PersonalHome")}>
            <Button variant="ghost" size="icon" className="text-zinc-400">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Usuários cadastrados</h1>
            <p className="text-sm text-zinc-500">{users.length} usuário(s)</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-12 text-zinc-500">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-12 text-center">
            <UserCircle className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum usuário cadastrado</h3>
            <p className="text-zinc-500">Os usuários aparecem aqui após se cadastrarem.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{u.full_name || "—"}</p>
                  <p className="text-sm text-zinc-400 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {u.email}
                  </p>
                  <span
                    className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                      u.user_type === "admin"
                        ? "bg-red-500/20 text-red-300"
                        : u.user_type === "personal"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-zinc-700 text-zinc-300"
                    }`}
                  >
                    {typeLabel(u.user_type)}
                  </span>
                </div>
                {u.created_at && (
                  <p className="text-xs text-zinc-500 flex-shrink-0">
                    {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
