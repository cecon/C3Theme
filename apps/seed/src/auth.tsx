import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';

import { PageLoader, useBranding } from '@c3theme/ui';
import { api, API_URL, tokenStore } from './api';
import { mockAuth } from './auth-mock';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
}

/** O que o login precisa do backend. Troque o mock pela sua API mantendo estas assinaturas. */
export interface AuthService {
  login(email: string, password: string): Promise<{ token: string; user: User }>;
  register(data: { name: string; email: string; password: string }): Promise<void>;
  me(token: string): Promise<User>;
  forgotPassword(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<void>;
  resetPassword(email: string, code: string, password: string): Promise<void>;
  updateProfile(token: string, changes: Partial<Pick<User, 'name' | 'phone'>>): Promise<User>;
  changePassword(token: string, current: string, next: string): Promise<void>;
}

/** Contrato HTTP esperado quando `VITE_API_URL` está definido. */
const httpAuth: AuthService = {
  login: (email, password) => api('/auth/login', { method: 'POST', json: { email, password } }),
  register: (data) => api('/auth/register', { method: 'POST', json: data }),
  me: () => api<{ user: User }>('/auth/me').then((r) => r.user),
  forgotPassword: (email) => api('/auth/forgot-password', { method: 'POST', json: { email } }),
  verifyCode: (email, code) => api('/auth/verify-code', { method: 'POST', json: { email, code } }),
  resetPassword: (email, code, password) => api('/auth/reset-password', { method: 'POST', json: { email, code, password } }),
  updateProfile: (_t, changes) => api<{ user: User }>('/auth/me', { method: 'PATCH', json: changes }).then((r) => r.user),
  changePassword: (_t, current, next) => api('/auth/change-password', { method: 'POST', json: { current, next } })
};

export const authService: AuthService = API_URL ? httpAuth : mockAuth;
export const USING_MOCK = !API_URL;

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: AuthService['register'];
  updateProfile: (changes: Partial<Pick<User, 'name' | 'phone'>>) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Sessão do usuário: valida o token salvo ao abrir, entra, sai e atualiza o perfil. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = tokenStore.get();
    if (!t) {
      setReady(true);
      return;
    }
    authService
      .me(t)
      .then(setUser)
      .catch(() => tokenStore.set(null))
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await authService.login(email, password);
    tokenStore.set(r.token);
    setUser(r.user);
  }, []);

  const logout = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (changes: Partial<Pick<User, 'name' | 'phone'>>) => {
    setUser(await authService.updateProfile(tokenStore.get() ?? '', changes));
  }, []);

  const changePassword = useCallback(
    (current: string, next: string) => authService.changePassword(tokenStore.get() ?? '', current, next),
    []
  );

  const value = useMemo(
    () => ({ user, login, logout, register: authService.register, updateProfile, changePassword }),
    [user, login, logout, updateProfile, changePassword]
  );

  if (!ready) return <PageLoader />;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro do AuthProvider');
  return ctx;
}

/** Só deixa passar quem está logado; os outros vão para o login e voltam depois. */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children ?? <Outlet />}</>;
}

/** Telas de login e cadastro: quem já está logado vai direto para onde queria. */
export function GuestOnly({ children }: { children?: ReactNode }) {
  const { user } = useAuth();
  const { homePath } = useBranding();
  const from = (useLocation().state as { from?: string } | null)?.from ?? homePath;
  if (user) return <Navigate to={from} replace />;
  return <>{children ?? <Outlet />}</>;
}
