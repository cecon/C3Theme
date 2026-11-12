import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BetterSqliteStore } from '../adapters/better-sqlite3';
import { buildEngine } from '../app/build';
import type { Engine } from '../app/engine';
import { ApiError } from '../domain/errors';
import type { Rec } from '../domain/types';
import type { Chat, ChatRoom } from '../ports/chat';
import type { EngineRequest } from '../ports/request';
import { handle } from './handle';

// Chat (spec/v0/chat.yaml): sem a porta, 404; com ela, histórico e envio por usuário, o SSE só da conversa do dono
// e a validação de cada corpo. Mesmos casos do crates/c3-engine/tests/chat.rs.
const app = { specVersion: '0', name: 'Teste', entities: ['note'] };
const note = { specVersion: '0', name: 'note', label: { singular: 'Nota', plural: 'Notas' }, fields: [{ name: 'text', type: 'string' }] };

const req = (method: string, path: string, user = 'ana', body?: unknown, query: Record<string, string> = {}): EngineRequest => ({
  method,
  path,
  query,
  headers: { 'x-user': user },
  body: body === undefined ? '' : JSON.stringify(body),
  locals: {}
});

const message = (id: string, direction: string, text: string): Rec => ({
  id,
  author: { id: direction, name: direction },
  direction,
  text,
  createdAt: '2026-11-12T12:00:00Z'
});

function port(calls: string[]): Chat {
  const log = new Map<string, Rec[]>();
  const of = (r: ChatRoom) => `${r.audience}/${r.conversation}`;
  return {
    audience: (r) => r.headers['x-user'] ?? '',
    history: (r, before, limit) => {
      const all = log.get(of(r)) ?? [];
      const found = before === undefined ? -1 : all.findIndex((m) => m.id === before);
      const end = found < 0 ? all.length : found;
      const start = Math.max(0, end - limit);
      return { messages: all.slice(start, end), hasMore: start > 0 };
    },
    send: (r, m) => {
      const list = log.get(of(r)) ?? [];
      const mine = { ...message(`u${list.length}`, 'out', m.text), clientId: m.clientId };
      const reply = message(`a${list.length}`, 'in', `Você disse ${m.text}`);
      log.set(of(r), [...list, mine, reply]);
      r.message(reply);
      return mine;
    },
    stop: (r) => {
      r.delta('a0', '', true);
      calls.push(`stop ${r.conversation}`);
    },
    answer: (r, id, a) => {
      if (id === 'respondida') throw ApiError.conflict('Já respondida.');
      // ids de teste: o formato de evento que o motor recusa vira 400
      const bad: Record<string, Rec> = { evento: { type: 'x' }, 'sem-tipo': {}, 'sem-mensagem': { type: 'message', message: 1 } };
      try {
        if (bad[id]) r.emit(bad[id]);
      } catch (e) {
        throw ApiError.badRequest((e as Error).message);
      }
      calls.push(`answer ${id} ${JSON.stringify(a)}`);
    },
    answerUi: (r, id, part, a) => {
      r.emit({ type: 'ui.cancel', partId: part, reason: 'agent' });
      calls.push(`ui ${id} ${part} ${String(a.action)}`);
    }
  };
}

const ROUTES = [
  ['GET', '/_chat/assistant/messages'],
  ['POST', '/_chat/assistant/messages'],
  ['GET', '/_chat/assistant/_events'],
  ['POST', '/_chat/assistant/_stop'],
  ['POST', '/_chat/assistant/messages/m1/_answer'],
  ['POST', '/_chat/assistant/messages/m1/_ui/p1']
];

describe('chat', () => {
  let dir: string;
  let store: BetterSqliteStore;
  let engine: Engine;
  const calls: string[] = [];

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'engine-node-chat-'));
    store = new BetterSqliteStore(join(dir, 't.db'));
    store.database.exec('CREATE TABLE note (id INTEGER PRIMARY KEY, text TEXT)');
    engine = await buildEngine({ store, app, entities: [note], chat: port(calls) });
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('sem a porta, as rotas são 404; conversa inválida é 400', async () => {
    const bare = await buildEngine({ store, app, entities: [note] });
    for (const [m, p] of ROUTES) {
      const res = await handle(bare, req(m, p));
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: expect.objectContaining({ message: 'Este sistema não tem assistente.' }) });
      expect((await handle(engine, req(m, p.replace('assistant', 'com espaço')))).status).toBe(400);
    }
    expect((await handle(engine, req('GET', '/_chat/assistant/outra'))).status).toBe(404);
    expect((await handle(engine, req('DELETE', '/_chat/assistant/messages'))).status).toBe(405);
  });

  it('envia e lê o histórico do usuário', async () => {
    const path = '/_chat/assistant/messages';
    const sent = await handle(engine, req('POST', path, 'ana', { clientId: 'c1', text: 'oi' }));
    expect(sent.status).toBe(200);
    expect(sent.body).toEqual({ data: expect.objectContaining({ clientId: 'c1', text: 'oi' }) });
    await handle(engine, req('POST', path, 'ana', { clientId: 'c2', text: 'tudo bem' }));
    const page = (await handle(engine, req('GET', path))).body as { messages: Rec[]; hasMore: boolean };
    expect(page.messages.map((m) => m.text)).toEqual(['oi', 'Você disse oi', 'tudo bem', 'Você disse tudo bem']);
    expect(page.hasMore).toBe(false);
    expect((await handle(engine, req('GET', path, 'ana', undefined, { limit: '1', before: 'u2' }))).body).toEqual({
      messages: [message('a0', 'in', 'Você disse oi')],
      hasMore: true
    });
    expect((await handle(engine, req('GET', path, 'ana', undefined, { limit: '0' }))).status).toBe(400);
    expect((await handle(engine, req('GET', path, 'beto'))).body).toEqual({ messages: [], hasMore: false });
    expect((await handle(engine, req('POST', path, 'ana', { text: 'oi' }))).status).toBe(400);
    expect((await handle(engine, req('POST', path, 'ana', [1]))).status).toBe(400);
  });

  it('SSE leva a resposta só ao dono e solta o ouvinte ao fechar', async () => {
    const res = await handle(engine, req('GET', '/_chat/assistant/_events'));
    expect(res.headers['content-type']).toBe('text/event-stream');
    const it = res.stream![Symbol.asyncIterator]();
    expect((await it.next()).value).toBe('event: ready\ndata: {}\n\n');
    const next = it.next();
    await handle(engine, req('POST', '/_chat/assistant/messages', 'beto', { clientId: 'c1', text: 'oi' }));
    await handle(engine, req('POST', '/_chat/outra/messages', 'ana', { clientId: 'c1', text: 'oi' }));
    await handle(engine, req('POST', '/_chat/assistant/messages', 'ana', { clientId: 'c9', text: 'olá' }));
    const event = (await next).value as string;
    expect(event.startsWith('event: message\n')).toBe(true);
    const data = JSON.parse(event.split('data: ')[1]);
    expect(data).toEqual({ type: 'message', message: expect.objectContaining({ text: 'Você disse olá', conversationId: 'assistant' }) });

    expect((await handle(engine, req('POST', '/_chat/assistant/_stop'))).status).toBe(204);
    expect((await it.next()).value).toBe(
      `event: delta\ndata: ${JSON.stringify({ type: 'delta', id: 'a0', text: '', done: true, conversationId: 'assistant' })}\n\n`
    );
    const waiting = it.next();
    await it.return!();
    expect((await waiting).done).toBe(true);
    expect((await it.next()).done).toBe(true);
  });

  it('responde pergunta e parte, e recusa evento fora do formato', async () => {
    const base = '/_chat/assistant/messages';
    expect((await handle(engine, req('POST', `${base}/m1/_answer`, 'ana', { optionIds: ['a'] }))).status).toBe(204);
    expect(calls).toContain('answer m1 {"optionIds":["a"]}');
    expect((await handle(engine, req('POST', `${base}/respondida/_answer`, 'ana', {}))).status).toBe(409);
    expect((await handle(engine, req('POST', `${base}/m1/_answer`, 'ana', { text: 1 }))).status).toBe(400);
    for (const [id, error] of [
      ['evento', "evento 'x' desconhecido"],
      ['sem-tipo', "evento '' desconhecido"],
      ['sem-mensagem', 'message precisa ser um objeto']
    ]) {
      const res = await handle(engine, req('POST', `${base}/${id}/_answer`, 'ana', {}));
      expect([res.status, (res.body as { error: { message: string } }).error.message]).toEqual([400, error]);
    }
    expect((await handle(engine, req('POST', `${base}/m1/_ui/p1`, 'ana', { action: 'accept', values: {} }))).status).toBe(204);
    expect(calls).toContain('ui m1 p1 accept');
    expect((await handle(engine, req('POST', `${base}/m1/_ui/p1`, 'ana', { action: 'talvez' }))).status).toBe(400);
    expect((await handle(engine, req('POST', `${base}/m1/_ui/p1`, 'ana'))).status).toBe(400);
  });
});
