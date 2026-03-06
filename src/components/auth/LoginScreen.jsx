import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, ArrowRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { createPageUrl } from "@/utils";
import OlimpikaLogo from "@/components/OlimpikaLogo";

export default function LoginScreen() {
  const { login, register, resetPassword, setAuthError, authError } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState("aluno");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isForgot, setIsForgot] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setAuthError?.(null);

    if (!email || !password) {
      setError("Informe e-mail e senha.");
      return;
    }
    setSubmitting(true);
    try {
      const userData = await login(email, password);
      if (userData.user_type === "personal") {
        navigate(createPageUrl("PersonalHome"), { replace: true });
      } else {
        navigate(createPageUrl("Home"), { replace: true });
      }
    } catch (err) {
      setError(err.message || "E-mail ou senha inválidos.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setAuthError?.(null);

    const name = (fullName || "").trim();
    const mail = (email || "").trim().toLowerCase();
    const pwd = (registerPassword || "").trim();
    const pwdConfirm = (registerPasswordConfirm || "").trim();

    if (!mail || !name) {
      setError("Informe nome completo e e-mail.");
      return;
    }
    if (!pwd || pwd.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (pwd !== pwdConfirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await register({
        full_name: name,
        email: mail,
        user_type: userType,
        password: pwd,
      });
      if (data.user_type === "personal") {
        navigate(createPageUrl("PersonalHome"), { replace: true });
      } else {
        navigate(createPageUrl("Home"), { replace: true });
      }
    } catch (err) {
      setError(err.message || "Não foi possível cadastrar.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setAuthError?.(null);

    const mail = (email || "").trim().toLowerCase();
    const pwd = (registerPassword || "").trim();
    const pwdConfirm = (registerPasswordConfirm || "").trim();

    if (!mail) {
      setError("Informe o e-mail cadastrado.");
      return;
    }
    if (!pwd || pwd.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (pwd !== pwdConfirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(mail, pwd);
      setInfo("Senha atualizada com sucesso. Faça login com a nova senha.");
      setPassword("");
      setRegisterPassword("");
      setRegisterPasswordConfirm("");
      setIsForgot(false);
      setMode("login");
    } catch (err) {
      setError(err.message || "Não foi possível redefinir a senha.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = error || authError?.message;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-8">
      {/* Logo igual à imagem: centralizada, só a arte (atleta + OLIMPIKA FITNESS) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 md:mb-10 w-full flex justify-center"
      >
        <OlimpikaLogo variant="full" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="max-w-3xl w-full grid md:grid-cols-2 gap-8 items-center"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {mode === "login"
              ? isForgot
                ? "Esqueceu sua senha"
                : "Faça login"
              : "Novo cadastro"}
          </h1>
          <p className="text-zinc-400 text-sm md:text-base mb-6">
            {mode === "login"
              ? isForgot
                ? "Informe seu e-mail e defina uma nova senha."
                : "Use seu e-mail e senha para acessar."
              : "Preencha os dados e defina sua senha (mínimo 6 caracteres)."}
          </p>

          {mode === "login" ? (
            <>
              {isForgot ? (
                <form onSubmit={handleForgotSubmit} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="E-mail cadastrado"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                  <Input
                    type="password"
                    placeholder="Nova senha (mín. 6 caracteres)"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                  <Input
                    type="password"
                    placeholder="Confirmar nova senha"
                    value={registerPasswordConfirm}
                    onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />

                  {displayError && (
                    <p className="text-sm text-red-400">{displayError}</p>
                  )}
                  {info && (
                    <p className="text-sm text-emerald-400">{info}</p>
                  )}

                  <div className="flex flex-col gap-2 mt-2">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 text-black font-semibold h-11 px-6 rounded-xl"
                    >
                      {submitting ? "Atualizando..." : "Atualizar senha"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgot(false);
                        setError("");
                        setInfo("");
                        setAuthError?.(null);
                      }}
                      className="text-xs text-zinc-400 hover:text-yellow-400 text-left"
                    >
                      Voltar para o login
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                  <Input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />

                  {displayError && (
                    <p className="text-sm text-red-400">{displayError}</p>
                  )}
                  {info && <p className="text-sm text-emerald-400">{info}</p>}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 text-black font-semibold h-11 px-6 rounded-xl mt-2"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    {submitting ? "Aguarde..." : "Entrar"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgot(true);
                      setError("");
                      setInfo("");
                      setAuthError?.(null);
                    }}
                    className="mt-2 text-xs text-zinc-400 hover:text-yellow-400"
                  >
                    Esqueceu sua senha?
                  </button>
                </form>
              )}
            </>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <Input
                type="text"
                placeholder="Nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white"
              />
              <Input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white"
              />
              <Input
                type="password"
                placeholder="Senha (mín. 6 caracteres)"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white"
              />
              <Input
                type="password"
                placeholder="Confirmar senha"
                value={registerPasswordConfirm}
                onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white"
              />
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Tipo de usuário</label>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-700 bg-zinc-900 text-white px-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="aluno">Aluno</option>
                  <option value="personal">Personal Trainer</option>
                </select>
              </div>

              {displayError && (
                <p className="text-sm text-red-400">{displayError}</p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 text-black font-semibold h-11 px-6 rounded-xl mt-2"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                {submitting ? "Cadastrando..." : "Cadastrar"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          <p className="mt-4 text-sm text-zinc-500">
            {mode === "login" ? (
              <>
                Não tem conta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setIsForgot(false);
                    setError("");
                    setInfo("");
                    setAuthError?.(null);
                  }}
                  className="text-yellow-400 hover:underline"
                >
                  Cadastrar
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setIsForgot(false);
                    setError("");
                    setInfo("");
                    setAuthError?.(null);
                  }}
                  className="text-yellow-400 hover:underline"
                >
                  Entrar
                </button>
              </>
            )}
          </p>
        </div>

        <div className="hidden md:block">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-xl font-semibold text-white mb-2">
                Tudo em um só lugar
              </h2>
              <p className="text-sm text-zinc-400 mb-4">
                Acompanhe treinos, histórico e desempenho. Se você é Personal,
                gerencie treinos e alunos com facilidade.
              </p>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  Treinos organizados e fáceis de seguir
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  Área dedicada para Personal Trainer
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  Histórico e evolução do aluno em tempo real
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
