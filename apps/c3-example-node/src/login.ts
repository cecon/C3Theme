// Login de demonstração para a shell (`auth` no app.json): `POST /auth/login` e `GET /auth/me`, como o adaptador
// `httpAuth` do `@c3theme/engine`. O token é o nome do usuário; senha de todos: `c3`. Nunca use num sistema real.

import type { EngineRequest, EngineResponse } from '@c3theme/engine-node';

const PASSWORD = 'c3';
const USERS: [string, string, string][] = [
  ['admin', 'Administrador', 'admin@exemplo.com'],
  ['ana', 'Ana Lima', 'ana@exemplo.com'],
  ['caio', 'Caio Souza', 'caio@exemplo.com']
];

const userJson = (login: string) => {
  const u = USERS.find(([id, , email]) => id === login || email === login);
  return u ? { id: u[0], name: u[1], email: u[2] } : undefined;
};

const reply = (status: number, body: unknown): EngineResponse => ({ status, headers: { 'content-type': 'application/json' }, body });
const unauthorized = (message: string) => reply(401, { error: { code: 'unauthorized', message } });

/** Responde as rotas de login; undefined para as outras. */
export function loginRoute(req: EngineRequest): EngineResponse | undefined {
  if (req.path === '/auth/login' && req.method === 'POST') {
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return reply(400, { error: { code: 'bad_request', message: 'Corpo precisa ser JSON.' } });
    }
    const id = typeof body.identifier === 'string' ? body.identifier.trim().toLowerCase() : '';
    const u = userJson(id);
    return u && body.password === PASSWORD ? reply(200, { token: u.id, user: u }) : unauthorized('Usuário ou senha incorretos.');
  }
  if (req.path === '/auth/me' && req.method === 'GET') {
    const h = req.headers.authorization;
    const t = h?.startsWith('Bearer ') ? h.slice(7).split('@')[0] : undefined;
    const u = t !== undefined ? userJson(t) : undefined;
    return u ? reply(200, { user: u }) : unauthorized('Sessão expirada.');
  }
  return undefined;
}
