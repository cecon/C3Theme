// "Esperando você": o que a conversa espera do humano agora (uma pergunta ou uma parte de interface aberta), para o
// aviso acima da caixa levar até ela. Puro: sem React.

import { isPending } from './question';
import type { Message } from './types';
import { findPendingPart } from './uiPending';

export interface Waiting {
  messageId: string;
  /** `question` ou o `kind` da parte (`c3.tool`, `c3.plan`, …). */
  kind: string;
  /** Quantas coisas esperam ao todo (pergunta e parte contam separado). */
  count: number;
}

/** A pendência mais nova da conversa, ou nada. */
export function waitingFor(messages: Message[], now = Date.now()): Waiting | undefined {
  const part = findPendingPart(messages, now);
  const partAt = messages.findIndex((m) => m.id === part?.messageId);
  const questionAt = messages.findLastIndex((m) => isPending(m.question));
  const count = Number(partAt >= 0) + Number(questionAt >= 0);
  if (count === 0) return undefined;
  if (partAt >= questionAt) return { messageId: messages[partAt].id, kind: part!.kind, count };
  return { messageId: messages[questionAt].id, kind: 'question', count };
}

/** Só vale avisar quando a pendência não está na última mensagem (que já fica à vista no fim da lista). */
export const shouldAnnounce = (messages: Message[], w: Waiting | undefined): w is Waiting =>
  !!w && messages[messages.length - 1]?.id !== w.messageId;
