// Eventos de tarefa do assistente: os mesmos do motor (`task.start`, `task.done`, `task.abandon`), com
// `channel: 'chat'`, para comparar com a tela normal (docs/chat-agentico.md, 13.4). Sem dado pessoal. O chat não
// entende o conteúdo das partes: quem diz qual entidade e operação cada uma é (`TaskOf`) é o app, normalmente com o
// `agentTaskOf` do @c3theme/engine. Puro: sem React.

import type { Message } from './types';
import { isPartOpen, type UiPart } from './ui';

export interface ChatTaskEvent {
  type: 'task.start' | 'task.done' | 'task.abandon';
  /** O id da parte: estável entre recarregamentos, então quem guarda pode descartar `task.start` repetido. */
  taskId: string;
  entity: string;
  op: 'create' | 'update' | 'action';
  channel: 'chat';
  action?: string;
  /** Mensagens do usuário desde o pedido até concluir (no fim). */
  turns?: number;
  /** Campos que a parte grava. */
  fields?: number;
  /** Campos que o assistente sugeriu. */
  suggested?: number;
  /** Desde o pedido do usuário, em milissegundos (no fim). */
  ms?: number;
}

/** Porta de telemetria do app. Mesma forma da `TelemetryPort` do motor: um destino serve os dois. */
export type ChatTelemetryPort = (event: ChatTaskEvent) => void;

/** O que a parte faz, ou `null` se ela não é tarefa (ex.: um formulário avulso que só responde ao assistente). */
export interface PartTask {
  entity: string;
  op: ChatTaskEvent['op'];
  action?: string;
  fields?: number;
  suggested?: number;
}
export type TaskOf = (part: UiPart) => PartTask | null;

interface OpenTask {
  base: Omit<ChatTaskEvent, 'type' | 'turns' | 'ms'>;
  /** Quando o usuário pediu: a primeira mensagem dele desde a parte anterior. */
  requestedAt: number;
}

/** O que já foi visto numa conversa. */
export interface TaskWatch {
  seen: Set<string>;
  open: Map<string, OpenTask>;
}

export const newTaskWatch = (): TaskWatch => ({ seen: new Set(), open: new Map() });

const mine = (m: Message) => m.direction === 'out' && m.kind !== 'system';

/**
 * Compara as mensagens com o que já viu e devolve os eventos novos (e anota em `watch`). Parte vista pela primeira
 * vez já fechada (histórico) não gera nada. Gravada (`submitted`, ou já `undone`) é `task.done`; recusada,
 * fechada ou vencida é `task.abandon`.
 */
export function watchTasks(watch: TaskWatch, messages: Message[], taskOf: TaskOf, now = Date.now()): ChatTaskEvent[] {
  const events: ChatTaskEvent[] = [];
  let request: Message | undefined;
  for (const m of messages) {
    if (mine(m)) request ??= m;
    for (const part of m.ui ?? []) {
      const open = isPartOpen(part, now);
      if (!watch.seen.has(part.id)) {
        watch.seen.add(part.id);
        const task = open ? taskOf(part) : null;
        if (task) {
          const base = { taskId: part.id, channel: 'chat' as const, ...task };
          watch.open.set(part.id, { base, requestedAt: Date.parse((request ?? m).createdAt) });
          events.push({ type: 'task.start', ...base });
        }
      } else if (!open && watch.open.has(part.id)) {
        const { base, requestedAt } = watch.open.get(part.id)!;
        watch.open.delete(part.id);
        const done = part.state === 'submitted' || part.state === 'undone';
        const turns = messages.filter((x) => mine(x) && Date.parse(x.createdAt) >= requestedAt).length;
        events.push({ type: done ? 'task.done' : 'task.abandon', ...base, turns, ms: Math.max(0, now - requestedAt) });
      }
    }
    // a próxima tarefa começa no próximo pedido do usuário depois desta parte
    if (m.ui?.length) request = undefined;
  }
  return events;
}
