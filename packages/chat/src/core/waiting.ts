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
  const question = messages.findLast((m) => isPending(m.question));
  const count = (part ? 1 : 0) + (question ? 1 : 0);
  if (!part && !question) return undefined;
  const partIndex = part ? messages.findIndex((m) => m.id === part.messageId) : -1;
  const questionIndex = question ? messages.indexOf(question) : -1;
  if (part && partIndex >= questionIndex) return { messageId: part.messageId, kind: part.kind, count };
  return { messageId: question!.id, kind: 'question', count };
}

/** Só vale avisar quando a pendência não está na última mensagem (que já fica à vista no fim da lista). */
export const shouldAnnounce = (messages: Message[], w: Waiting | undefined): w is Waiting =>
  !!w && messages[messages.length - 1]?.id !== w.messageId;
