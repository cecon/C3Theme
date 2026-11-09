// Adaptador HTTP da porta de autenticação: a convenção /auth/* que o sistema pode seguir para não escrever o seu.

import { ApiError } from '../api';
import { browserFetch, type C3Fetch } from '../transport';
import type { AuthPort, AuthUser } from './port';

/**
 * `POST /auth/login {identifier, password}` → `{token, user}`; `GET /auth/me` → `{user}`; e, se o sistema tiver,
 * `/auth/register`, `/auth/forgot-password`, `/auth/verify-code`, `/auth/reset-password`, `PATCH /auth/me` e
 * `/auth/change-password`. Erros no formato do contrato (`{ error: { code, message } }`). `fetch` é o transporte
 * (no Electron, o mesmo `ipcFetch` passado ao `<C3Shell transport>`).
 */
export function httpAuth(apiUrl: string, fetch: C3Fetch = browserFetch): AuthPort {
  const base = apiUrl.replace(/\/$/, '');
  async function call<T>(method: string, path: string, body?: unknown, token?: string): Promise<T> {
    const res = await fetch(base + path, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    }).catch(() => {
      throw new ApiError(0, 'network', 'Sem conexão com o servidor.');
    });
    if (res.status === 204) return undefined as T;
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, json?.error?.code ?? 'internal', json?.error?.message ?? `Erro ${res.status}.`);
    return json as T;
  }
  const user = (r: { user: AuthUser }) => r.user;

  return {
    login: (identifier, password) => call('POST', '/auth/login', { identifier, password }),
    me: (token) => call<{ user: AuthUser }>('GET', '/auth/me', undefined, token).then(user),
    register: (data) => call('POST', '/auth/register', data),
    forgotPassword: (identifier) => call('POST', '/auth/forgot-password', { identifier }),
    verifyCode: (identifier, code) => call('POST', '/auth/verify-code', { identifier, code }),
    resetPassword: (identifier, code, password) => call('POST', '/auth/reset-password', { identifier, code, password }),
    updateProfile: (token, changes) => call<{ user: AuthUser }>('PATCH', '/auth/me', changes, token).then(user),
    changePassword: (token, current, next) => call('POST', '/auth/change-password', { current, next }, token)
  };
}
