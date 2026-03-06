import React, { createContext, useState, useContext, useEffect } from 'react';
import { localApi } from '@/api/localApiClient';

const LOCAL_USER_KEY = 'academia_user';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(LOCAL_USER_KEY) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error('Restore auth failed:', e);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const setUserAndPersist = (userData) => {
    setUser(userData);
    setIsAuthenticated(!!userData);
    setAuthError(null);
    if (typeof window !== 'undefined') {
      if (userData) {
        window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userData));
      } else {
        window.localStorage.removeItem(LOCAL_USER_KEY);
      }
    }
  };

  const updateUser = (partial) => {
    if (!user) return;
    const next = { ...user, ...partial };
    setUserAndPersist(next);
  };

  const login = async (email, password) => {
    setAuthError(null);
    const data = await localApi.login(email, password);
    setUserAndPersist(data);
    return data;
  };

  const register = async (payload) => {
    setAuthError(null);
    const data = await localApi.register(payload);
    setUserAndPersist(data);
    return data;
  };

  const resetPassword = async (email, newPassword) => {
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
        isLoadingPublicSettings: false,
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
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
