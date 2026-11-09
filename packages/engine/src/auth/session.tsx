import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { browserFetch, type C3Fetch } from '../transport';
import type { AuthConfig, AuthPort, AuthUser } from './port';

const TOKEN_KEY = 'c3.token';

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string | null) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* sem storage: a sessão vale só até recarregar */
    }
  }
};

export interface AuthSession {
  port: AuthPort;
  config: AuthConfig;
  /** Nome do sistema, de GET /_meta/login (a tela de entrada vem antes do /_meta/app). */
  appName: string;
  user: AuthUser | null;
  token: string | null;
  login(identifier: string, password: string): Promise<void>;
  logout(): void;
  setUser(user: AuthUser): void;
}

const SessionContext = createContext<AuthSession | null>(null);

/** Sessão da shell com `auth`; fora dela (sistema sem login pela shell) devolve null. */
export function useAuthSession(): AuthSession | null {
  return useContext(SessionContext);
}

/** O mesmo, para as telas de entrada, que só existem com sessão. */
export function useAuth(): AuthSession {
  const s = useContext(SessionContext);
  if (!s) throw new Error('telas de entrada fora do <C3Shell auth>');
  return s;
}

/**
 * Lê `GET /_meta/login` e valida o token guardado. `children` recebe a sessão já resolvida (com ou sem usuário);
 * enquanto isso, mostra `loading`.
 */
export function AuthSessionProvider({
  port,
  apiUrl,
  transport = browserFetch,
  loading,
  failed,
  children
}: {
  port: AuthPort;
  apiUrl: string;
  /** Transporte de GET /_meta/login (o mesmo do cliente). */
  transport?: C3Fetch;
  loading: ReactNode;
  failed: (message: string, retry: () => void) => ReactNode;
  children: (session: AuthSession) => ReactNode;
}) {
  const [meta, setMeta] = useState<{ name: string; auth: AuthConfig }>();
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(undefined);
    (async () => {
      const res = await transport(`${apiUrl.replace(/\/$/, '')}/_meta/login`).catch(() => null);
      if (!res || (!res.ok && res.status !== 404)) throw new Error(res ? `Erro ${res.status}.` : 'Sem conexão com o servidor.');
      // backend sem a rota: login com o padrão, já que o sistema passou a porta
      const data = res.ok ? (await res.json()).data : { name: '', auth: null };
      const saved = tokenStore.get();
      const me = saved ? await port.me(saved).catch(() => null) : null;
      if (!me) tokenStore.set(null);
      if (!active) return;
      setMeta({ name: data.name ?? '', auth: data.auth ?? {} });
      setUserState(me);
      setToken(me ? saved : null);
      setReady(true);
    })().catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [apiUrl, port, transport, attempt]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const r = await port.login(identifier, password);
      tokenStore.set(r.token);
      setToken(r.token);
      setUserState(r.user);
    },
    [port]
  );

  const logout = useCallback(() => {
    const t = tokenStore.get();
    if (t) port.logout?.(t).catch(() => {});
    tokenStore.set(null);
    setToken(null);
    setUserState(null);
  }, [port]);

  const session = useMemo<AuthSession | undefined>(
    () => meta && { port, config: meta.auth, appName: meta.name, user, token, login, logout, setUser: setUserState },
    [meta, port, user, token, login, logout]
  );

  if (error) return <>{failed(error, () => setAttempt((n) => n + 1))}</>;
  if (!ready || !session) return <>{loading}</>;
  return <SessionContext.Provider value={session}>{children(session)}</SessionContext.Provider>;
}
