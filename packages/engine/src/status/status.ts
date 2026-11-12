// Sistema fora do ar de propósito (`status` do app.json ou 503 em /_meta/*): regras puras, sem React nem HTTP.

import type { AppStatusDef } from './AppStatus';

/** Recado padrão da página `comingSoon`. */
export const PAGE_SOON_MESSAGE = 'Esta tela está quase pronta.';

/** Instante (ms) de `until`; data inválida ou ausente vira `undefined`. */
export function untilTime(until: string | undefined): number | undefined {
  const t = Date.parse(until ?? '');
  return Number.isNaN(t) ? undefined : t;
}

/** `Retry-After` em segundos ou data HTTP, como ISO; ausente ou ilegível vira `undefined`. */
export function retryAfterUntil(header: string | null, now: number): string | undefined {
  const value = header?.trim() ?? '';
  const at = /^\d+$/.test(value) ? now + Number(value) * 1000 : Date.parse(value);
  return Number.isNaN(at) ? undefined : new Date(at).toISOString();
}

const MODES = new Set<string>(['maintenance', 'comingSoon']);

const isText = (t: unknown): t is NonNullable<AppStatusDef['title']> =>
  (typeof t === 'string' && t !== '') || (typeof t === 'object' && t !== null && 'id' in t);

/** O `status` de um corpo JSON (ou de `{ status }`), só com o que é válido; sem `mode` válido, `undefined`. */
export function readStatus(raw: unknown): AppStatusDef | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const s = raw as Record<string, unknown>;
  if (!MODES.has(s.mode as string)) return undefined;
  return {
    mode: s.mode as AppStatusDef['mode'],
    ...(isText(s.title) && { title: s.title }),
    ...(isText(s.message) && { message: s.message }),
    ...(typeof s.until === 'string' && untilTime(s.until) !== undefined && { until: s.until })
  };
}

/**
 * O status de uma resposta 503 de /_meta/*: o do corpo (`{ status }`, se o proxy mandar JSON) ou
 * manutenção com a previsão do `Retry-After`.
 */
export function statusFromReply(body: unknown, retryAfter: string | null, now: number): AppStatusDef {
  const inBody = readStatus((body as { status?: unknown } | null)?.status);
  if (inBody) return inBody;
  const until = retryAfterUntil(retryAfter, now);
  return { mode: 'maintenance', ...(until && { until }) };
}
