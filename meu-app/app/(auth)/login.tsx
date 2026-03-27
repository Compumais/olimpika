import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/AuthContext';
import OlimpikaLogo from '@/components/OlimpikaLogo';

export default function LoginScreen() {
  const { login, register, resetPassword, setAuthError, authError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<'aluno' | 'personal'>('aluno');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isForgot, setIsForgot] = useState(false);

  const navigateAfterAuth = (userType: string) => {
    if (userType === 'personal' || userType === 'admin') {
      router.replace('/(tabs)');
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleLoginSubmit = async () => {
    setError('');
    setInfo('');
    setAuthError?.(null);
    if (!email || !password) {
      setError('Informe e-mail e senha.');
      return;
    }
    setSubmitting(true);
    try {
      const userData = await login(email, password);
      navigateAfterAuth((userData as { user_type?: string }).user_type || 'aluno');
    } catch (err) {
      setError((err as Error).message || 'E-mail ou senha inválidos.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async () => {
    setError('');
    setInfo('');
    setAuthError?.(null);
    const name = (fullName || '').trim();
    const mail = (email || '').trim().toLowerCase();
    const pwd = (registerPassword || '').trim();
    const pwdConfirm = (registerPasswordConfirm || '').trim();
    if (!mail || !name) {
      setError('Informe nome completo e e-mail.');
      return;
    }
    if (!pwd || pwd.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (pwd !== pwdConfirm) {
      setError('As senhas não coincidem.');
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
      navigateAfterAuth((data as { user_type?: string }).user_type || 'aluno');
    } catch (err) {
      setError((err as Error).message || 'Não foi possível cadastrar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async () => {
    setError('');
    setInfo('');
    setAuthError?.(null);
    const mail = (email || '').trim().toLowerCase();
    const pwd = (registerPassword || '').trim();
    const pwdConfirm = (registerPasswordConfirm || '').trim();
    if (!mail) {
      setError('Informe o e-mail cadastrado.');
      return;
    }
    if (!pwd || pwd.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (pwd !== pwdConfirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(mail, pwd);
      setInfo('Senha atualizada com sucesso. Faça login com a nova senha.');
      setPassword('');
      setRegisterPassword('');
      setRegisterPasswordConfirm('');
      setIsForgot(false);
      setMode('login');
    } catch (err) {
      setError((err as Error).message || 'Não foi possível redefinir a senha.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = error || authError?.message;

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoWrap}>
        <OlimpikaLogo variant="full" />
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>
          {mode === 'login'
            ? isForgot
              ? 'Esqueceu sua senha'
              : 'Faça login'
            : 'Novo cadastro'}
        </Text>
        <Text style={styles.subtitle}>
          {mode === 'login'
            ? isForgot
              ? 'Informe seu e-mail e defina uma nova senha.'
              : 'Use seu e-mail e senha para acessar.'
            : 'Preencha os dados e defina sua senha (mínimo 6 caracteres).'}
        </Text>

        {mode === 'login' ? (
          <>
            {isForgot ? (
              <View style={styles.inputGroup}>
                <Input
                  placeholder="E-mail cadastrado"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  style={styles.input}
                />
                <Input
                  placeholder="Nova senha (mín. 6 caracteres)"
                  value={registerPassword}
                  onChangeText={setRegisterPassword}
                  secureTextEntry
                  style={styles.input}
                />
                <Input
                  placeholder="Confirmar nova senha"
                  value={registerPasswordConfirm}
                  onChangeText={setRegisterPasswordConfirm}
                  secureTextEntry
                  style={styles.input}
                />
                {displayError && <Text style={styles.error}>{displayError}</Text>}
                {info && <Text style={styles.info}>{info}</Text>}
                <Button onPress={handleForgotSubmit} disabled={submitting}>
                  <Text style={styles.btnText}>
                    {submitting ? 'Atualizando...' : 'Atualizar senha'}
                  </Text>
                </Button>
                <Pressable
                  onPress={() => {
                    setIsForgot(false);
                    setError('');
                    setInfo('');
                    setAuthError?.(null);
                  }}
                >
                  <Text style={styles.link}>Voltar para o login</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Input
                  placeholder="E-mail"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  style={styles.input}
                />
                <Input
                  placeholder="Senha"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={styles.input}
                />
                {displayError && <Text style={styles.error}>{displayError}</Text>}
                {info && <Text style={styles.info}>{info}</Text>}
                <Button onPress={handleLoginSubmit} disabled={submitting}>
                  {submitting ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <>
                      <Ionicons name="log-in-outline" size={20} color="#000" />
                      <Text style={styles.btnText}>Entrar</Text>
                      <Ionicons name="arrow-forward" size={16} color="#000" />
                    </>
                  )}
                </Button>
                <Pressable
                  onPress={() => {
                    setIsForgot(true);
                    setError('');
                    setInfo('');
                    setAuthError?.(null);
                  }}
                >
                  <Text style={styles.link}>Esqueceu sua senha?</Text>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          <View style={styles.inputGroup}>
            <Input
              placeholder="Nome completo"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
            />
            <Input
              placeholder="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={styles.input}
            />
            <Input
              placeholder="Senha (mín. 6 caracteres)"
              value={registerPassword}
              onChangeText={setRegisterPassword}
              secureTextEntry
              style={styles.input}
            />
            <Input
              placeholder="Confirmar senha"
              value={registerPasswordConfirm}
              onChangeText={setRegisterPasswordConfirm}
              secureTextEntry
              style={styles.input}
            />
            <Text style={styles.label}>Tipo de usuário</Text>
            <View style={styles.typeRow}>
              <Pressable
                onPress={() => setUserType('aluno')}
                style={[styles.typeBtn, userType === 'aluno' && styles.typeBtnActive]}
              >
                <Text style={styles.typeBtnText}>Aluno</Text>
              </Pressable>
              <Pressable
                onPress={() => setUserType('personal')}
                style={[styles.typeBtn, userType === 'personal' && styles.typeBtnActive]}
              >
                <Text style={styles.typeBtnText}>Personal</Text>
              </Pressable>
            </View>
            {displayError && <Text style={styles.error}>{displayError}</Text>}
            <Button onPress={handleRegisterSubmit} disabled={submitting}>
              <Ionicons name="person-add-outline" size={20} color="#000" />
              <Text style={styles.btnText}>
                {submitting ? 'Cadastrando...' : 'Cadastrar'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#000" />
            </Button>
          </View>
        )}

        <Text style={styles.switch}>
          {mode === 'login' ? (
            <>
              Não tem conta?{' '}
              <Text
                style={styles.switchLink}
                onPress={() => {
                  setMode('register');
                  setIsForgot(false);
                  setError('');
                  setInfo('');
                  setAuthError?.(null);
                }}
              >
                Cadastrar
              </Text>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <Text
                style={styles.switchLink}
                onPress={() => {
                  setMode('login');
                  setIsForgot(false);
                  setError('');
                  setInfo('');
                  setAuthError?.(null);
                }}
              >
                Entrar
              </Text>
            </>
          )}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: '#09090b',
    padding: 24,
    paddingTop: 48,
  },
  logoWrap: {
    marginBottom: 32,
    alignItems: 'center',
  },
  form: {
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 24,
  },
  error: {
    fontSize: 14,
    color: '#f87171',
    marginVertical: 8,
  },
  info: {
    fontSize: 14,
    color: '#34d399',
    marginVertical: 8,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  link: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
    backgroundColor: '#18181b',
    alignItems: 'center',
  },
  typeBtnActive: {
    borderColor: '#eab308',
    backgroundColor: 'rgba(234,179,8,0.1)',
  },
  typeBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  switch: {
    marginTop: 24,
    fontSize: 14,
    color: '#71717a',
  },
  switchLink: {
    color: '#eab308',
  },
  inputGroup: {
    gap: 12,
  },
  input: {
    marginBottom: 12,
  },
});
