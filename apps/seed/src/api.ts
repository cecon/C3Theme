/**
 * Chamadas à API do sistema. Com `VITE_API_URL` definido, vão ao backend com o token no header;
 * sem ele, o seed roda sozinho com o mock de `auth-mock.ts`.
 */
export const API_URL: string | undefined = import.meta.env.VITE_API_URL || undefined;

const TOKEN_KEY = 'c3-token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string | null) => (token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY))
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields?: Record<string, string>
  ) {
    super(message);
  }
}

/** fetch com JSON, token e erros no formato `{ mensagem, campos }`. Um 401 limpa a sessão e volta ao login. */
export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.json !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...init.headers
    },
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body
  });
  if (res.status === 401 && token) {
    tokenStore.set(null);
    window.location.assign(`${import.meta.env.BASE_URL}login`);
  }
  const body = res.status === 204 ? undefined : await res.json().catch(() => undefined);
  if (!res.ok) throw new ApiError(body?.mensagem ?? body?.message ?? 'Falha na comunicação com o servidor.', res.status, body?.campos);
  return body as T;
}
