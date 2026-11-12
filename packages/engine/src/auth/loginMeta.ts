// GET /_meta/login, antes de haver usuário: o nome e o `auth` do app.json, ou o `status` do sistema fora do ar (no
// corpo ou num 503 de proxy). Sem React: a sessão só aplica o resultado.

import type { C3Fetch } from '../transport';
import type { AppStatusDef } from '../status/AppStatus';
import { readStatus, statusFromReply } from '../status/status';
import type { AuthConfig } from './port';

export type LoginMeta = { status: AppStatusDef } | { status?: undefined; name: string; auth: AuthConfig };

export async function readLoginMeta(transport: C3Fetch, apiUrl: string, now = Date.now()): Promise<LoginMeta> {
  const res = await transport(`${apiUrl.replace(/\/$/, '')}/_meta/login`).catch(() => null);
  if (res?.status === 503) return { status: statusFromReply(await res.json().catch(() => null), res.headers.get('retry-after'), now) };
  if (!res || (!res.ok && res.status !== 404)) throw new Error(res ? `Erro ${res.status}.` : 'Sem conexão com o servidor.');
  // backend sem a rota: login com o padrão, já que o sistema passou a porta
  const data = res.ok ? (await res.json()).data : { name: '', auth: null };
  const status = readStatus(data.status);
  return status ? { status } : { name: data.name ?? '', auth: data.auth ?? {} };
}
