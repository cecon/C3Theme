// Regra de concorrência das partes de interface (docs/chat-agentico.md, 13.1): no máximo uma parte pendente por
// conversa. Se o assistente manda outra, a anterior fecha como `cancelled` com motivo `superseded`; a mensagem que o
// usuário digita leva a parte pendente (`pendingPart`) para o assistente decidir se mantém ou cancela; e responder a
// uma parte que já não está pendente dá 409. Puro: sem React e sem rede.

import type { Message } from './types';
import { cancelPart, isPartOpen, type UiCancelReason, type UiPart } from './ui';

/** A parte que espera resposta, como vai no contexto da mensagem digitada. */
export interface PendingPart {
  messageId: string;
  partId: string;
  kind: string;
  version?: number;
}

/** A parte ainda aberta da conversa (a mais nova, se houver mais de uma por engano do servidor). */
export function findPendingPart(messages: Message[], now = Date.now()): PendingPart | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const parts = m.ui ?? [];
    for (let j = parts.length - 1; j >= 0; j--) {
      const p = parts[j];
      if (isPartOpen(p, now)) return { messageId: m.id, partId: p.id, kind: p.kind, version: p.version };
    }
  }
  return undefined;
}

/** Troca as partes que `change` devolver diferentes; mensagens sem mudança continuam as mesmas (mesmo objeto). */
function mapParts(messages: Message[], change: (p: UiPart, m: Message) => UiPart): Message[] {
  let touched = false;
  const out = messages.map((m) => {
    if (!m.ui?.length) return m;
    let changed = false;
    const ui = m.ui.map((p) => {
      const next = change(p, m);
      if (next !== p) changed = true;
      return next;
    });
    if (!changed) return m;
    touched = true;
    return { ...m, ui };
  });
  return touched ? out : messages;
}

/** A parte está aberta e não é a `keep`: com outra mais nova, ela sai. */
const isStale = (keep: PendingPart, now: number) => (p: UiPart, m: Message) =>
  isPartOpen(p, now) && !(m.id === keep.messageId && p.id === keep.partId);

/**
 * Deixa só a parte pendente mais nova aberta; as outras abertas fecham com motivo `superseded`. Mensagens em ordem
 * de criação (como na janela). Idempotente.
 */
export function keepOnePending(messages: Message[], now = Date.now()): Message[] {
  const keep = findPendingPart(messages, now);
  if (!keep) return messages;
  const stale = isStale(keep, now);
  return mapParts(messages, (p, m) => (stale(p, m) ? cancelPart(p, 'superseded') : p));
}

/** As partes que `keepOnePending` fecharia (o servidor avisa cada uma com `ui.cancel`). */
export function supersededBy(messages: Message[], now = Date.now()): { messageId: string; partId: string }[] {
  const keep = findPendingPart(messages, now);
  if (!keep) return [];
  const stale = isStale(keep, now);
  return messages.flatMap((m) => (m.ui ?? []).filter((p) => stale(p, m)).map((p) => ({ messageId: m.id, partId: p.id })));
}

/** Aplica o `ui.cancel`: a parte `partId`, se ainda pendente, fecha com o motivo. */
export function applyUiCancel(messages: Message[], partId: string, reason: UiCancelReason): Message[] {
  return mapParts(messages, (p) => (p.id === partId && (p.state ?? 'pending') === 'pending' ? cancelPart(p, reason) : p));
}

/**
 * O servidor recusou a resposta porque a parte já não está pendente (ou mudou de versão): HTTP 409. `part` é a parte
 * como está no servidor, quando ele devolve.
 */
export class UiConflictError extends Error {
  readonly status = 409;
  constructor(readonly part?: UiPart) {
    super('A parte não está mais pendente.');
    this.name = 'UiConflictError';
  }
}

/** Erro de conflito vindo de qualquer transporte: `UiConflictError` ou um erro com `status: 409`. */
export const isUiConflict = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { status?: unknown }).status === 409;
