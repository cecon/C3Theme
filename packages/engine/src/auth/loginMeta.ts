// GET /_meta/login, antes de haver usuário: o nome e o `auth` do app.json, e o `status` do sistema fora do ar (no
// corpo ou num 503 de proxy). Sem React: a sessão só aplica o resultado.

import type { C3Fetch } from '../transport';
import type { AppStatusDef } from '../status/AppStatus';
import { readStatus, statusFromReply } from '../status/status';
import type { AuthConfig } from './port';

export interface LoginMeta {
  name: string;
  auth: AuthConfig;
  status?: AppStatusDef;
}

export async function readLoginMeta(transport: C3Fetch, apiUrl: string, now = Date.now()): Promise<LoginMeta> {
  const res = await transport(`${apiUrl.replace(/\/$/, '')}/_meta/login`).catch(() => undefined);
  if (res?.status === 503) {
    const body: unknown = await res.json().catch(() => undefined);
    return { name: '', auth: {}, status: statusFromReply(body, res.headers.get('retry-after'), now) };
  }
  if (!res || (!res.ok && res.status !== 404)) throw new Error(res ? `Erro ${res.status}.` : 'Sem conexão com o servidor.');
  // backend sem a rota: login com o padrão, já que o sistema passou a porta
  const data = res.ok ? (await res.json()).data : {};
  const status = readStatus(data.status);
  return { name: data.name ?? '', auth: data.auth ?? {}, ...(status && { status }) };
}
