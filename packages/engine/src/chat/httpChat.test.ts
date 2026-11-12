import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../apiError';
import { httpChatTransport, nextDelay, toChatEvent, type ChatRequest } from './httpChat';

afterEach(() => vi.useRealTimers());

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** SSE que manda os blocos e fica aberto até o `signal` abortar. */
function sse(blocks: string[], signal?: AbortSignal | null) {
  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      for (const b of blocks) c.enqueue(enc.encode(b));
      signal?.addEventListener('abort', () => c.error(new DOMException('aborted', 'AbortError')));
    }
  });
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
}

describe('httpChatTransport', () => {
  it('rotas e corpos de spec/v0/chat.yaml', async () => {
    const calls: [string, RequestInit | undefined][] = [];
    const request: ChatRequest = async (path, init) => {
      calls.push([path, init]);
      if (path.endsWith('/_stop') || path.includes('/_answer') || path.includes('/_ui/')) return new Response(null, { status: 204 });
      if (init?.method === 'POST') return json({ data: { id: 'm2', clientId: 'c1' } });
      return json({ messages: [], hasMore: false });
    };
    const t = httpChatTransport(request);
    expect(await t.loadMessages('a b', { limit: 30 })).toEqual({ messages: [], hasMore: false });
    await t.loadMessages('assistant', { limit: 10, before: 'm1' });
    expect(await t.send({ clientId: 'c1', conversationId: 'assistant', text: 'oi', replyTo: 'm0' })).toEqual({ id: 'm2', clientId: 'c1' });
    await t.send({ clientId: 'c2', conversationId: 'assistant', pendingPart: { messageId: 'm1', partId: 'p1', kind: 'c3.form' } });
    t.stop!('assistant');
    await t.answer!('assistant', 'm/1', { optionIds: ['a'] });
    await t.answerUi!('assistant', 'm1', 'p 1', { action: 'decline' });
    await vi.waitFor(() => expect(calls).toHaveLength(7));
    expect(calls.map(([p, i]) => [p, i?.method, i?.body])).toEqual([
      ['/_chat/a%20b/messages?limit=30', 'GET', undefined],
      ['/_chat/assistant/messages?limit=10&before=m1', 'GET', undefined],
      ['/_chat/assistant/messages', 'POST', JSON.stringify({ clientId: 'c1', text: 'oi', replyTo: 'm0' })],
      [
        '/_chat/assistant/messages',
        'POST',
        JSON.stringify({ clientId: 'c2', text: '', pendingPart: { messageId: 'm1', partId: 'p1', kind: 'c3.form' } })
      ],
      ['/_chat/assistant/_stop', 'POST', undefined],
      ['/_chat/assistant/messages/m%2F1/_answer', 'POST', JSON.stringify({ optionIds: ['a'] })],
      ['/_chat/assistant/messages/m1/_ui/p%201', 'POST', JSON.stringify({ action: 'decline' })]
    ]);
    expect(calls[2][1]?.headers).toEqual({ 'content-type': 'application/json' });
  });

  it('erro do servidor vira ApiError com o status (409 fecha o card); sem rede, network', async () => {
    const t = httpChatTransport(async () => json({ error: { code: 'conflict', message: 'Já respondida.' } }, 409));
    const err = await t.answerUi!('a', 'm1', 'p1', { action: 'accept' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 409, code: 'conflict', message: 'Já respondida.' });
    const bare = await httpChatTransport(async () => new Response('x', { status: 502 }))
      .loadMessages('a', { limit: 1 })
      .catch((e) => e);
    expect(bare).toMatchObject({ status: 502, code: 'internal', message: 'Erro 502.' });
    const offline = await httpChatTransport(() => Promise.reject(new TypeError('fetch')))
      .send({ clientId: 'c', conversationId: 'a', text: 'x' })
      .catch((e) => e);
    expect(offline).toMatchObject({ status: 0, code: 'network' });
    // parar sem rede não estoura
    httpChatTransport(() => Promise.reject(new TypeError('fetch'))).stop!('a');
  });

  it('SSE: entrega os eventos da conversa, pula ready e lixo, e para ao cancelar', async () => {
    const delta = { type: 'delta', conversationId: 'a', id: 'm1', text: 'Olá' };
    const seen: string[] = [];
    let signal: AbortSignal | null | undefined;
    const t = httpChatTransport(async (path, init) => {
      seen.push(path);
      signal = init?.signal;
      return sse(
        [
          'event: ready\ndata: {}\n\n',
          `event: delta\ndata: ${JSON.stringify(delta)}\n\n`,
          'event: delta\ndata: {quebrado\n\n',
          'event: ',
          'outro\ndata: {}\n\n'
        ],
        signal
      );
    });
    const events: unknown[] = [];
    const stop = t.subscribe('a', (e) => events.push(e));
    await vi.waitFor(() => expect(events).toEqual([delta]));
    expect(seen).toEqual(['/_chat/a/_events']);
    stop();
    expect(signal?.aborted).toBe(true);
  });

  it('SSE: reconecta quando cai e desiste no 404', async () => {
    vi.useFakeTimers();
    let n = 0;
    const t = httpChatTransport(async () =>
      ++n === 1 ? new Response('', { status: 200 }) : json({ error: { message: 'Sem chat.' } }, 404)
    );
    const stop = t.subscribe('a', () => {});
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(5000);
    expect(n).toBe(2);
    stop();
    let m = 0;
    const flaky = httpChatTransport(async () => (++m, Promise.reject(new TypeError('fetch'))));
    const off = flaky.subscribe('a', () => {});
    await vi.advanceTimersByTimeAsync(3100);
    expect(m).toBe(3);
    off();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(m).toBe(3);
  });

  it('toChatEvent e nextDelay', () => {
    expect(toChatEvent({ event: 'ready', data: '{}' })).toBeNull();
    expect(toChatEvent({ event: 'message', data: '{"type":"delta"}' })).toBeNull();
    expect(toChatEvent({ event: 'typing', data: 'null' })).toBeNull();
    expect(toChatEvent({ event: 'ui.cancel', data: '{"type":"ui.cancel","partId":"p"}' })).toEqual({ type: 'ui.cancel', partId: 'p' });
    expect([nextDelay(1000), nextDelay(20_000)]).toEqual([2000, 30_000]);
  });
});
