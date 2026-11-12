import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

import type { ChatEvent, ChatTransport } from '../core/transport';
import type { QuestionAnswer } from '../core/question';
import type { Author, Message } from '../core/types';
import { answerPart, cancelPart, type UiAnswer } from '../core/ui';
import { findPendingPart, isUiConflict } from '../core/uiPending';
import { isGenerating, oldestId, openWindow, windowReducer } from '../core/window';

export interface UseMessageWindowOptions {
  /** Eu: autor das mensagens otimistas. */
  me: Author;
  /** Mensagens por página. Padrão 30. */
  pageSize?: number;
  /** Gera o `clientId` do envio. Padrão: `crypto.randomUUID()`. */
  newId?: () => string;
}

/**
 * Mensagens de uma conversa: abre pelas mais recentes, sobe no histórico com `loadOlder`, recebe eventos do
 * transporte e envia com resposta otimista (a mensagem aparece na hora como `sending` e vira `failed` se der erro).
 * Com assistente de IA, `generating` diz se há resposta sendo escrita e `stop` pede para parar.
 */
export default function useMessageWindow(transport: ChatTransport, conversationId: string, options: UseMessageWindowOptions) {
  const { me, pageSize = 30, newId = () => crypto.randomUUID() } = options;
  const [state, dispatch] = useReducer(windowReducer, conversationId, openWindow);
  const live = useRef(state);
  live.current = state;

  // abre a conversa: mais recentes + eventos
  useEffect(() => {
    dispatch({ type: 'open', conversationId });
    dispatch({ type: 'loading', what: 'initial' });
    const ctrl = new AbortController();
    transport
      .loadMessages(conversationId, { limit: pageSize }, ctrl.signal)
      .then((page) => dispatch({ type: 'page', conversationId, page, older: false }))
      .catch((error) => !ctrl.signal.aborted && dispatch({ type: 'error', conversationId, error }));
    const stop = transport.subscribe(conversationId, (event) => dispatch({ type: 'event', event }));
    return () => {
      ctrl.abort();
      stop();
    };
  }, [transport, conversationId, pageSize]);

  const loadOlder = useCallback(async () => {
    const s = live.current;
    if (s.loading || !s.hasMore) return;
    dispatch({ type: 'loading', what: 'older' });
    try {
      const page = await transport.loadMessages(s.conversationId, { before: oldestId(s), limit: pageSize });
      dispatch({ type: 'page', conversationId: s.conversationId, page, older: true });
    } catch (error) {
      dispatch({ type: 'error', conversationId: s.conversationId, error });
    }
  }, [transport, pageSize]);

  const deliver = useCallback(
    async (draft: Message, files?: Blob[]) => {
      dispatch({ type: 'optimistic', message: { ...draft, status: 'sending' } });
      try {
        const saved = await transport.send({
          clientId: draft.clientId!,
          conversationId: draft.conversationId,
          text: draft.text,
          files,
          replyTo: draft.replyTo,
          pendingPart: findPendingPart(live.current.messages),
          ...(draft.steer && { steer: true })
        });
        dispatch({ type: 'event', event: { type: 'message', message: { ...saved, clientId: draft.clientId } } });
      } catch {
        dispatch({ type: 'failed', clientId: draft.clientId! });
      }
    },
    [transport]
  );

  /**
   * Envia texto e/ou arquivos. Texto só com espaços não sai. A parte que espera resposta vai junto (`pendingPart`).
   * `steer`: orienta o turno em andamento (aparece na fila como "Orientando" até o agente ler).
   */
  const send = useCallback(
    (text: string, opts: { files?: Blob[]; replyTo?: string; steer?: boolean } = {}) => {
      const body = text.trim();
      if (!body && !opts.files?.length) return;
      const clientId = newId();
      const attachments = opts.files?.map((f, i) => ({
        id: `${clientId}-${i}`,
        name: (f as File).name ?? '',
        size: f.size,
        contentType: f.type
      }));
      const draft: Message = {
        id: clientId,
        clientId,
        conversationId: live.current.conversationId,
        author: me,
        direction: 'out',
        text: body || undefined,
        attachments,
        createdAt: new Date().toISOString(),
        replyTo: opts.replyTo,
        ...(opts.steer && { steer: 'pending' as const })
      };
      void deliver(draft, opts.files);
    },
    [deliver, me, newId]
  );

  /** Tenta de novo uma mensagem que falhou (texto; arquivos precisam ser escolhidos de novo). */
  const retry = useCallback(
    (clientId: string) => {
      const failed = live.current.messages.find((m) => m.clientId === clientId && m.status === 'failed');
      if (failed) void deliver({ ...failed, attachments: undefined });
    },
    [deliver]
  );

  /** Pede ao assistente para parar; `undefined` quando o transporte não sabe parar. */
  const stop = useMemo(() => (transport.stop ? () => transport.stop!(live.current.conversationId) : undefined), [transport]);
  const generating = useMemo(() => isGenerating(state.messages), [state.messages]);

  /**
   * Responde a pergunta do assistente na mensagem `messageId`: o card mostra a resposta na hora e volta a perguntar
   * se o transporte falhar. `undefined` quando o transporte não recebe respostas.
   */
  const answer = useMemo(() => {
    if (!transport.answer) return undefined;
    return async (messageId: string, reply: QuestionAnswer) => {
      const before = live.current.messages.find((m) => m.id === messageId);
      if (!before?.question) return;
      const put = (message: Message) => dispatch({ type: 'event', event: { type: 'message', message } });
      put({ ...before, question: { ...before.question, answer: reply } });
      try {
        await transport.answer!(before.conversationId, messageId, reply);
      } catch {
        put(before);
      }
    };
  }, [transport]);

  /**
   * Responde a parte `partId` da mensagem `messageId` (formulário, rascunho, ação): o estado muda na hora e volta se o
   * transporte falhar. Se o servidor disser 409 (a parte já não estava pendente), o card fecha como substituído, com o
   * estado que o servidor devolver, se devolver. Devolve se o servidor aceitou. `undefined` quando o transporte não
   * recebe respostas.
   */
  const answerUi = useMemo(() => {
    if (!transport.answerUi) return undefined;
    return async (messageId: string, partId: string, reply: UiAnswer): Promise<boolean> => {
      const before = live.current.messages.find((m) => m.id === messageId);
      const part = before?.ui?.find((p) => p.id === partId);
      if (!before || !part) return false;
      const put = (message: Message) => dispatch({ type: 'event', event: { type: 'message', message } });
      const swap = (next: typeof part) => put({ ...before, ui: before.ui!.map((p) => (p.id === partId ? next : p)) });
      swap(answerPart(part, reply));
      try {
        await transport.answerUi!(before.conversationId, messageId, partId, { ...reply, version: part.version });
        return true;
      } catch (error) {
        const server = isUiConflict(error) ? (error as { part?: typeof part }).part : undefined;
        if (server) swap(server);
        else if (isUiConflict(error) && reply.action !== 'undo') swap(cancelPart(part, 'superseded'));
        else put(before);
        return false;
      }
    };
  }, [transport]);

  /**
   * Tira uma orientação que o agente ainda não leu: some na hora e volta se o transporte falhar (409: ele já leu).
   * `undefined` quando o transporte não remove.
   */
  const remove = useMemo(() => {
    if (!transport.remove) return undefined;
    return async (messageId: string) => {
      const before = live.current.messages.find((m) => m.id === messageId);
      if (!before) return;
      const put = (event: ChatEvent) => dispatch({ type: 'event', event });
      put({ type: 'removed', conversationId: before.conversationId, id: messageId });
      try {
        await transport.remove!(before.conversationId, messageId);
      } catch {
        put({ type: 'message', message: before });
      }
    };
  }, [transport]);

  const dismissNotice = useCallback(() => dispatch({ type: 'dismissNotice' }), []);

  return { ...state, loadOlder, send, retry, stop, generating, answer, answerUi, remove, dismissNotice };
}
