// Janela de mensagens de uma conversa: estado puro e as transições, sem React e sem rede.

import type { ChatEvent, MessagePage, NoticeTone } from './transport';
import type { Message } from './types';
import { applyUiCancel, keepOnePending } from './uiPending';

export interface WindowState {
  conversationId: string;
  /** Da mais antiga para a mais nova. */
  messages: Message[];
  /** Há histórico mais antigo para carregar. */
  hasMore: boolean;
  /** `initial`: abrindo a conversa; `older`: subindo no histórico. */
  loading: 'initial' | 'older' | null;
  error: unknown;
  /** Aviso passageiro mais recente (evento `notice`); `seq` muda a cada aviso, mesmo de texto igual. */
  notice: Notice | null;
}

export interface Notice {
  seq: number;
  text: string;
  tone: NoticeTone;
}

export type WindowAction =
  | { type: 'open'; conversationId: string }
  | { type: 'loading'; what: 'initial' | 'older' }
  | { type: 'page'; conversationId: string; page: MessagePage; older: boolean }
  | { type: 'error'; conversationId: string; error: unknown }
  | { type: 'event'; event: ChatEvent }
  | { type: 'optimistic'; message: Message }
  | { type: 'failed'; clientId: string }
  | { type: 'dismissNotice' };

export const openWindow = (conversationId: string): WindowState => ({
  conversationId,
  messages: [],
  hasMore: false,
  loading: 'initial',
  error: null,
  notice: null
});

const byTime = (a: Message, b: Message) =>
  a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/**
 * Junta mensagens sem repetir: a mesma `id` (ou o mesmo `clientId`, quando o servidor confirma um envio otimista)
 * fica com a versão que chegou por último. Resultado em ordem de criação.
 */
export function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  if (incoming.length === 0) return current;
  const out = [...current];
  for (const m of incoming) {
    const at = out.findIndex((c) => c.id === m.id || (m.clientId !== undefined && c.clientId === m.clientId));
    if (at >= 0) out[at] = m;
    else out.push(m);
  }
  return out.sort(byTime);
}

export function windowReducer(state: WindowState, action: WindowAction): WindowState {
  switch (action.type) {
    case 'open':
      return action.conversationId === state.conversationId ? state : openWindow(action.conversationId);
    case 'loading':
      return { ...state, loading: action.what, error: null };
    case 'page':
      // resposta atrasada de outra conversa: ignora
      if (action.conversationId !== state.conversationId) return state;
      return {
        ...state,
        messages: keepOnePending(mergeMessages(state.messages, action.page.messages)),
        // só a primeira página e as mais antigas dizem se há histórico acima; recarregar as recentes não
        hasMore: action.older || state.loading === 'initial' ? action.page.hasMore : state.hasMore,
        loading: null
      };
    case 'error':
      return action.conversationId === state.conversationId ? { ...state, loading: null, error: action.error } : state;
    case 'optimistic':
      return { ...state, messages: mergeMessages(state.messages, [action.message]) };
    case 'failed':
      return {
        ...state,
        messages: state.messages.map((m) => (m.clientId === action.clientId && m.status === 'sending' ? { ...m, status: 'failed' } : m))
      };
    case 'dismissNotice':
      return { ...state, notice: null };
    case 'event':
      return applyEvent(state, action.event);
  }
}

function applyEvent(state: WindowState, event: ChatEvent): WindowState {
  if (event.type === 'typing') return state;
  if (event.type === 'notice') {
    if (event.conversationId !== state.conversationId) return state;
    return { ...state, notice: { seq: (state.notice?.seq ?? 0) + 1, text: event.text, tone: event.tone ?? 'info' } };
  }
  if (event.type === 'delta') {
    if (event.conversationId !== state.conversationId) return state;
    return {
      ...state,
      messages: state.messages.map((m) => (m.id === event.id ? appendDelta(m, event.text, event.done, event.channel) : m))
    };
  }
  if (event.type === 'removed') {
    if (event.conversationId !== state.conversationId) return state;
    return { ...state, messages: state.messages.filter((m) => m.id !== event.id) };
  }
  if (event.type === 'ui.cancel') {
    if (event.conversationId !== state.conversationId) return state;
    const scope = state.messages.filter((m) => !event.messageId || m.id === event.messageId);
    const done = applyUiCancel(scope, event.partId, event.reason);
    return done === scope ? state : { ...state, messages: mergeMessages(state.messages, done) };
  }
  if (event.message.conversationId !== state.conversationId) return state;
  // uma parte nova fecha a que estava pendente (só uma por conversa)
  return { ...state, messages: keepOnePending(mergeMessages(state.messages, [event.message])) };
}

/**
 * Soma um pedaço ao texto (ou ao raciocínio) de uma resposta em andamento; `done` encerra. Usado também pelos
 * transportes.
 */
export function appendDelta(m: Message, text: string, done?: boolean, channel: 'text' | 'reasoning' = 'text'): Message {
  const next = channel === 'reasoning' ? { ...m, reasoning: (m.reasoning ?? '') + text } : { ...m, text: (m.text ?? '') + text };
  return done ? { ...next, streaming: false } : next;
}

/** Alguma resposta ainda está sendo escrita. */
export const isGenerating = (messages: Message[]) => messages.some((m) => m.streaming);

/** Id da mensagem mais antiga carregada: o cursor para pedir a página anterior. */
export const oldestId = (state: WindowState) => state.messages[0]?.id;
