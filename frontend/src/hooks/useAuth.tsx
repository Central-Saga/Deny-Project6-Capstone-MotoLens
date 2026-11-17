'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { LoginPayload, RegisterPayload, User } from '@/types/auth';
import { getStoredToken, setStoredToken } from '@/services/apiClient';
import { authService } from '@/services/authService';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    try {
      const res = await authService.me();
      setUser(res.data);
    } catch {
      setStoredToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(async (payload: LoginPayload): Promise<User> => {
    const res = await authService.login(payload);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(
    async (payload: RegisterPayload): Promise<User> => {
      const res = await authService.register(payload);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    },
    []
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(user && token);
  const isAdmin = Boolean(user?.roles?.includes('admin'));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
