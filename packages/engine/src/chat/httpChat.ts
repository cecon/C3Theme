// Adaptador HTTP da porta ChatTransport do @c3theme/chat, pelas rotas de spec/v0/chat.yaml. Sem React; só tipos do
// pacote de chat (o código dele entra no bundle de quem abre o assistente).

import type { ChatEvent, ChatTransport, Message, MessagePage } from '@c3theme/chat';

import { ApiError } from '../apiError';
import { parseSse } from '../live/sse';

/** Um pedido à API com a sessão (base, cabeçalhos e o 401 já resolvidos por quem cria o cliente). */
export type ChatRequest = (path: string, init?: RequestInit) => Promise<Response>;

/** Espera antes de reconectar o SSE, dobrando até 30 s. */
export const nextDelay = (ms: number) => Math.min(ms * 2, 30_000);

const EVENTS = new Set(['message', 'delta', 'typing', 'removed', 'ui.cancel']);

/** Evento do SSE em ChatEvent; `ready`, nome desconhecido ou JSON quebrado viram null. */
export function toChatEvent(e: { event: string; data: string }): ChatEvent | null {
  if (!EVENTS.has(e.event)) return null;
  try {
    const event = JSON.parse(e.data) as ChatEvent;
    return event && event.type === e.event ? event : null;
  } catch {
    return null;
  }
}

async function fail(res: Response): Promise<never> {
  const err = (await res.json().catch(() => null))?.error;
  throw new ApiError(res.status, err?.code ?? 'internal', err?.message ?? `Erro ${res.status}.`, err?.fields);
}

export function httpChatTransport(request: ChatRequest): ChatTransport {
  const path = (conversation: string, rest: string) => `/_chat/${encodeURIComponent(conversation)}${rest}`;
  const network = () => new ApiError(0, 'network', 'Sem conexão com o servidor.');

  async function call<T>(url: string, method: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    const init: RequestInit = { method, signal };
    if (body !== undefined) Object.assign(init, { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
    const res = await request(url, init).catch((e: unknown) => {
      throw signal?.aborted ? e : network();
    });
    if (!res.ok) return fail(res);
    return (res.status === 204 ? undefined : await res.json()) as T;
  }

  /** Lê o SSE até o servidor fechar ou o `signal` abortar. */
  async function read(conversation: string, onEvent: (e: ChatEvent) => void, signal: AbortSignal) {
    const res = await request(path(conversation, '/_events'), { headers: { accept: 'text/event-stream' }, signal });
    if (!res.ok || !res.body) return fail(res);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      const { events, rest } = parseSse(buffer + decoder.decode(value, { stream: true }));
      buffer = rest;
      for (const e of events) {
        const event = toChatEvent(e);
        if (event) onEvent(event);
      }
    }
  }

  return {
    loadMessages: (conversation, page, signal) => {
      const q = new URLSearchParams({ limit: String(page.limit), ...(page.before && { before: page.before }) });
      return call<MessagePage>(path(conversation, `/messages?${q}`), 'GET', undefined, signal);
    },
    send: (m) => {
      const body = {
        clientId: m.clientId,
        text: m.text ?? '',
        ...(m.replyTo && { replyTo: m.replyTo }),
        ...(m.pendingPart && { pendingPart: m.pendingPart })
      };
      return call<{ data: Message }>(path(m.conversationId, '/messages'), 'POST', body).then((r) => r.data);
    },
    subscribe: (conversation, onEvent) => {
      const ctrl = new AbortController();
      void (async () => {
        let wait = 1000;
        while (!ctrl.signal.aborted) {
          try {
            await read(conversation, onEvent, ctrl.signal);
            wait = 1000;
          } catch (e) {
            // sem chat, sem sessão ou sem acesso: não adianta insistir
            if (ctrl.signal.aborted || (e instanceof ApiError && [400, 401, 403, 404].includes(e.status))) return;
          }
          await new Promise((r) => setTimeout(r, wait));
          wait = nextDelay(wait);
        }
      })();
      return () => ctrl.abort();
    },
    stop: (conversation) => void call(path(conversation, '/_stop'), 'POST').catch(() => undefined),
    answer: (conversation, id, answer) => call<void>(path(conversation, `/messages/${encodeURIComponent(id)}/_answer`), 'POST', answer),
    answerUi: (conversation, id, part, answer) =>
      call<void>(path(conversation, `/messages/${encodeURIComponent(id)}/_ui/${encodeURIComponent(part)}`), 'POST', answer)
  };
}
