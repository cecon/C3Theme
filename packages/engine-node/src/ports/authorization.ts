// Autorização de outro usuário (`app.authorization`, #48): os campos que a shell manda no cabeçalho
// `C3-Authorization` (JSON em base64, UTF-8) ao reenviar um pedido recusado com um dos códigos. Quem confere a
// senha e a permissão de quem libera, e grava a auditoria, é o sistema, no hook.

import type { RequestContext } from './hooks';

/** Os campos da autorização, ou `undefined` sem cabeçalho ou com cabeçalho malformado. */
export function authorizationOf(ctx: Pick<RequestContext, 'req'>): Record<string, unknown> | undefined {
  const raw = ctx.req.headers['c3-authorization'];
  if (!raw || !/^[A-Za-z0-9+/]+=*$/.test(raw.trim())) return undefined;
  try {
    const value: unknown = JSON.parse(Buffer.from(raw.trim(), 'base64').toString('utf8'));
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}
