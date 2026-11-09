import type { ChatEvent, ChatTransport } from '../core/transport';
import type { Author, Message } from '../core/types';
import { answerPart, isPartOpen, type UiAnswer, type UiCancelReason } from '../core/ui';
import { applyUiCancel, keepOnePending, supersededBy, UiConflictError } from '../core/uiPending';
import { appendDelta } from '../core/window';

/**
 * Transporte em memória: para testes, vitrine e protótipo antes do backend existir. `emit` simula o servidor
 * empurrando um evento. Segue as regras das partes de interface que um servidor de verdade segue: só uma pendente por
 * conversa (a nova fecha a anterior e avisa com `ui.cancel`), e resposta a parte que não está pendente dá 409.
 */
export function memoryTransport(
  seed: Message[] = [],
  {
    latencyMs = 0,
    me = { id: 'me', name: 'Eu' } as Author,
    onStop,
    onAnswerUi
  }: {
    latencyMs?: number;
    me?: Author;
    onStop?: (conversationId: string) => void;
    /** Recebe as respostas das partes de interface (o "assistente" do protótipo reage aqui). */
    onAnswerUi?: (conversationId: string, messageId: string, partId: string, answer: UiAnswer) => void;
  } = {}
) {
  const store = [...seed].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const listeners = new Map<string, Set<(e: ChatEvent) => void>>();
  let seq = 0;
  const wait = () => new Promise((r) => setTimeout(r, latencyMs));

  const notify = (conversationId: string, event: ChatEvent) => listeners.get(conversationId)?.forEach((l) => l(event));
  /** Troca as mensagens da conversa no lugar (mesma ordem). */
  const replace = (conversationId: string, next: (all: Message[]) => Message[]) => {
    const all = store.filter((m) => m.conversationId === conversationId);
    const after = next(all);
    after.forEach((m, i) => m !== all[i] && store.splice(store.indexOf(all[i]), 1, m));
  };
  /** Mensagem nova com parte aberta: as que estavam pendentes saem como `superseded`. */
  const supersede = (conversationId: string) => {
    const gone = supersededBy(store.filter((m) => m.conversationId === conversationId));
    if (gone.length === 0) return;
    replace(conversationId, (all) => keepOnePending(all));
    gone.forEach((ref) => notify(conversationId, { type: 'ui.cancel', conversationId, ...ref, reason: 'superseded' }));
  };

  /** Simula o servidor: grava (mensagem nova ou removida) e avisa quem assina a conversa. */
  const emit = (conversationId: string, event: ChatEvent) => {
    const at = store.findIndex((m) => m.id === (event.type === 'message' ? event.message.id : event.type === 'removed' ? event.id : null));
    if (event.type === 'message') store.splice(at < 0 ? store.length : at, at < 0 ? 0 : 1, event.message);
    if (event.type === 'ui.cancel') replace(conversationId, (all) => applyUiCancel(all, event.partId, event.reason));
    if (event.type === 'removed' && at >= 0) store.splice(at, 1);
    if (event.type === 'delta') {
      const i = store.findIndex((m) => m.id === event.id);
      if (i >= 0) store[i] = appendDelta(store[i], event.text, event.done, event.channel);
    }
    notify(conversationId, event);
    if (event.type === 'message') supersede(conversationId);
  };
  /** Simula o assistente desistindo de uma parte. */
  const cancelUi = (conversationId: string, partId: string, reason: UiCancelReason = 'agent') =>
    emit(conversationId, { type: 'ui.cancel', conversationId, partId, reason });

  const transport: ChatTransport = {
    async loadMessages(conversationId, { before, limit }) {
      await wait();
      const all = store.filter((m) => m.conversationId === conversationId);
      const end = before ? all.findIndex((m) => m.id === before) : all.length;
      const from = Math.max(0, (end < 0 ? all.length : end) - limit);
      return { messages: all.slice(from, end < 0 ? all.length : end), hasMore: from > 0 };
    },
    async send(out) {
      await wait();
      const saved: Message = {
        id: `m${++seq}`,
        clientId: out.clientId,
        conversationId: out.conversationId,
        author: me,
        direction: 'out',
        text: out.text,
        createdAt: new Date().toISOString(),
        status: 'sent',
        replyTo: out.replyTo
      };
      store.push(saved);
      // os outros assinantes (outra aba, lista de conversas) também ficam sabendo
      listeners.get(out.conversationId)?.forEach((l) => l({ type: 'message', message: saved }));
      return saved;
    },
    subscribe(conversationId, onEvent) {
      const set = listeners.get(conversationId) ?? new Set();
      set.add(onEvent);
      listeners.set(conversationId, set);
      return () => set.delete(onEvent);
    },
    sendTyping() {},
    async answerUi(conversationId, messageId, partId, answer) {
      await wait();
      const i = store.findIndex((m) => m.id === messageId);
      const part = i < 0 ? undefined : store[i].ui?.find((p) => p.id === partId);
      if (!part) throw new Error('parte desconhecida');
      // `undo` responde uma parte já gravada; o resto, só a pendente e na mesma versão
      const stale =
        answer.action === 'undo' ? part.state !== 'submitted' : !isPartOpen(part) || (answer.version ?? part.version) !== part.version;
      if (stale) throw new UiConflictError(part);
      store[i] = { ...store[i], ui: store[i].ui!.map((p) => (p.id === partId ? answerPart(p, answer) : p)) };
      onAnswerUi?.(conversationId, messageId, partId, answer);
    },
    ...(onStop && { stop: onStop })
  };
  return { transport, emit, cancelUi, store };
}
