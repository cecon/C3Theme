// Conversas à parte (issue #10). Uma conversa principal pode ter conversas filhas:
// - `aside` (à parte): pergunta lateral que não interrompe o trabalho em andamento na principal;
// - `branch` (ramo): tenta outro caminho a partir de uma mensagem (`fromMessageId`), com o histórico até ela.
// E ações por mensagem ("Ramificar daqui"), declaradas como dado: o `when` é um filtro, não uma função, para caber
// no app.json (ADR 0003).

import type { Conversation, Message } from './types';

export type LaneKind = 'aside' | 'branch';

/** Uma conversa à parte: é uma conversa como as outras, com o pai e de onde saiu. */
export interface Lane extends Conversation {
  kind: LaneKind;
  /** A conversa principal. */
  parentId: string;
  /** Ramo: a mensagem da principal de onde saiu. */
  fromMessageId?: string;
  /** O agente ainda trabalha nela (lista mostra "trabalhando" e põe em cima). */
  working?: boolean;
}

/** Em quais mensagens a ação aparece. Campo ausente: qualquer valor. */
export interface MessageMatch {
  /** `in`: recebida (resposta do assistente); `out`: enviada por mim. */
  direction?: 'in' | 'out';
  /** `agent`: autor é agente (ou sem `kind`, no assistente); `person`: autor é gente. */
  author?: 'agent' | 'person';
}

/** Ação no menu de uma mensagem. */
export interface MessageAction {
  id: string;
  label: string;
  when?: MessageMatch;
  /** Abre uma conversa à parte a partir da mensagem (o ramo leva o histórico até ela). */
  opens?: LaneKind;
}

/** Id da ação pronta "Ramificar daqui". */
export const BRANCH_ACTION = 'c3.branch';

/** A mensagem passa no filtro? Mensagem de sistema, passagem de tarefa e resposta ainda chegando não têm ações. */
export function matchesMessage(message: Message, when: MessageMatch = {}): boolean {
  if (message.kind === 'system' || message.kind === 'handoff' || message.streaming) return false;
  if (when.direction && message.direction !== when.direction) return false;
  if (when.author && authorKind(message) !== when.author) return false;
  return true;
}

/** Autor sem `kind`: quem chega é o assistente; quem sai sou eu (gente). */
const authorKind = (m: Message): 'agent' | 'person' => m.author.kind ?? (m.direction === 'in' ? 'agent' : 'person');

/** Ações que valem para esta mensagem, na ordem declarada. Mensagem ainda enviando (otimista) não tem. */
export function actionsFor(message: Message, actions: readonly MessageAction[] = []): MessageAction[] {
  if (message.status === 'sending' || message.status === 'failed') return [];
  return actions.filter((a) => matchesMessage(message, a.when));
}

/** Ramo: o histórico da principal até a mensagem (inclusive). Mensagem que não está na lista: vazio. */
export function messagesUntil(messages: readonly Message[], messageId: string): Message[] {
  // fora da lista, findIndex dá -1 e o corte fica vazio
  return messages.slice(0, messages.findIndex((m) => m.id === messageId) + 1);
}

/** Ordem da lista: as que trabalham em cima; depois a mais recente. */
export function sortLanes(lanes: readonly Lane[]): Lane[] {
  return [...lanes].sort((a, b) => Number(!!b.working) - Number(!!a.working) || b.updatedAt.localeCompare(a.updatedAt));
}

/** Quantas trabalham agora (selo no botão que abre o painel). */
export const workingCount = (lanes: readonly Lane[]) => lanes.filter((l) => l.working).length;
