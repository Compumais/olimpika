import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { localApi } from '@/api/localApiClient';

const LOCAL_USER_KEY = 'academia_user';

type User = {
  id?: string;
  email?: string;
  full_name?: string;
  user_type?: string;
  student_id?: string;
  avatar_url?: string;
  height?: string;
  weight_kg?: string;
  goal?: string;
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  authError: { message?: string } | null;
  setAuthError: (err: { message?: string } | null) => void;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: Record<string, unknown>) => Promise<User>;
  resetPassword: (email: string, newPassword: string) => Promise<unknown>;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<{ message?: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LOCAL_USER_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as User;
          setUser(parsed);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('Restore auth failed:', e);
      } finally {
        setIsLoadingAuth(false);
      }
    })();
  }, []);

  const setUserAndPersist = (userData: User | null) => {
    setUser(userData);
    setIsAuthenticated(!!userData);
    setAuthError(null);
    if (userData) {
      AsyncStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userData)).catch(() => {});
    } else {
      AsyncStorage.removeItem(LOCAL_USER_KEY).catch(() => {});
    }
  };

  const updateUser = (partial: Partial<User>) => {
    if (!user) return;
    const next = { ...user, ...partial };
    setUserAndPersist(next);
  };

  const login = async (email: string, password: string) => {
    setAuthError(null);
    const data = (await localApi.login(email, password)) as User;
    setUserAndPersist(data);
    return data;
  };

  const register = async (payload: Record<string, unknown>) => {
    setAuthError(null);
    const data = (await localApi.register(payload)) as User;
    setUserAndPersist(data);
    return data;
  };

  const resetPassword = async (email: string, newPassword: string) => {
    setAuthError(null);
    return localApi.resetPassword(email, newPassword);
  };

  const logout = () => {
    setUserAndPersist(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        authError,
        setAuthError,
        login,
        register,
        resetPassword,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
