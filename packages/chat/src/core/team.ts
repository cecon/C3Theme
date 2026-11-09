// Conversa com vários agentes (e pessoas): quem passou tarefa para quem, quem responde por ela e o pedido de
// aprovação de ferramenta. Puro: sem React e sem rede.

import type { AgentState } from './agents';
import { continuesGroup } from './grouping';
import type { QuestionAnswer } from './question';
import type { Author, Message } from './types';

/** Um agente passou uma tarefa para outro ("Atendente passou para Cozinha: confirmar 2 lasanhas"). */
export interface Handoff {
  from: Author;
  to: Author;
  /** A tarefa, em texto para gente. */
  task: string;
  /** Id da tarefa no app: com ele (e `onOpenTask`), o marcador vira botão que abre a tarefa. */
  taskId?: string;
}

/** Ferramenta que o agente pede para usar, na pergunta `kind: 'approval'`. */
export interface ToolRequest {
  /** Nome técnico, ex.: "estoque_baixar". */
  name: string;
  /** Nome para gente, ex.: "Baixar estoque". Sem isso, mostra o `name`. */
  label?: string;
  /** Argumentos, em texto já formatado pelo app (ex.: JSON indentado). Ficam recolhidos. */
  input?: string;
}

/** As três respostas de uma aprovação, nos `optionIds` da resposta. */
export const APPROVAL = { once: 'allow_once', always: 'allow_always', decline: 'decline' } as const;

export type ApprovalChoice = keyof typeof APPROVAL;

/** A resposta de uma escolha de aprovação, para mandar pelo `ChatTransport.answer`. */
export const approvalAnswer = (choice: ApprovalChoice): QuestionAnswer => ({ optionIds: [APPROVAL[choice]] });

/** O que a pessoa escolheu numa aprovação já respondida; dispensar conta como recusa. */
export function approvalChoice(answer: QuestionAnswer | undefined): ApprovalChoice | undefined {
  if (!answer) return undefined;
  if (answer.dismissed) return 'decline';
  const id = answer.optionIds?.[0];
  return (Object.keys(APPROVAL) as ApprovalChoice[]).find((k) => APPROVAL[k] === id);
}

/** Quem é agente: `kind: 'agent'`. Sem `kind`, o autor recebido segue o jeito da lista (compatível com antes). */
export const isAgent = (author: Author) => author.kind === 'agent';

/**
 * Para cada autor, os ids das mensagens do último bloco dele (mensagens seguidas, como no agrupamento): é só ali que
 * o avatar mostra o estado atual (o anel que gira ou pulsa). Nas mensagens antigas o estado de agora não diz nada, e o
 * movimento repetido cansa.
 */
export function latestBlocks(messages: readonly Message[]): Map<string, Set<string>> {
  const last = new Map<string, Set<string>>();
  messages.forEach((m, i) => {
    if (m.kind === 'system' || m.kind === 'handoff') return;
    const ids = continuesGroup(messages[i - 1], m) ? last.get(m.author.id) : undefined;
    last.set(m.author.id, ids ? ids.add(m.id) : new Set([m.id]));
  });
  return last;
}

/** Estado a mostrar no avatar da mensagem: o atual do autor, só no último bloco dele. */
export function stateFor(
  message: Message,
  states: Readonly<Record<string, AgentState>> | undefined,
  latest: Map<string, Set<string>>
): AgentState | undefined {
  return states && latest.get(message.author.id)?.has(message.id) ? states[message.author.id] : undefined;
}
