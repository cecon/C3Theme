import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BetterSqliteStore } from '../adapters/better-sqlite3';
import { buildEngine } from '../app/build';
import type { Engine } from '../app/engine';
import { ApiError } from '../domain/errors';
import type { Chat } from '../ports/chat';
import type { EngineRequest } from '../ports/request';
import { handle } from './handle';

// Orientar o turno em andamento (ADR 0008): mesmos casos do crates/c3-engine/tests/chat_steer.rs.
const app = { specVersion: '0', name: 'Teste', entities: ['note'] };
const note = { specVersion: '0', name: 'note', label: { singular: 'Nota', plural: 'Notas' }, fields: [{ name: 'text', type: 'string' }] };
const URI = '/_chat/assistant/messages';

const req = (method: string, path: string, body?: unknown): EngineRequest => ({
  method,
  path,
  query: {},
  headers: {},
  body: body === undefined ? '' : JSON.stringify(body),
  locals: {}
});

/** Porta mínima: "parado" responde com o aviso; remove só `s1` (o resto já foi lido). */
const base: Chat = {
  audience: () => 'ana',
  history: () => ({ messages: [], hasMore: false }),
  send: (r, m) => {
    if (m.text === 'parado') r.notice('O agente já tinha terminado.');
    return { id: 's1', clientId: m.clientId, direction: 'out', text: m.text, steer: m.steer ? 'pending' : null };
  },
  answer: () => undefined,
  answerUi: () => undefined
};
const withRemove: Chat = {
  ...base,
  remove: (r, id) => {
    if (id !== 's1') throw ApiError.conflict('O agente já leu esta mensagem.');
    r.emit({ type: 'removed', id });
  }
};

describe('chat: orientar', () => {
  let dir: string;
  let store: BetterSqliteStore;
  let engine: Engine;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'engine-node-steer-'));
    store = new BetterSqliteStore(join(dir, 't.db'));
    store.database.exec('CREATE TABLE note (id INTEGER PRIMARY KEY, text TEXT)');
    engine = await buildEngine({ store, app, entities: [note], chat: withRemove });
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('steer chega à porta e fora do formato é 400', async () => {
    const steer = await handle(engine, req('POST', URI, { clientId: 'c1', text: 'vá', steer: true }));
    expect(steer.status).toBe(200);
    expect((steer.body as { data: { steer: string } }).data.steer).toBe('pending');
    const plain = await handle(engine, req('POST', URI, { clientId: 'c2', text: 'oi' }));
    expect((plain.body as { data: { steer: null } }).data.steer).toBeNull();
    const bad = await handle(engine, req('POST', URI, { clientId: 'c3', text: 'oi', steer: 'sim' }));
    expect([bad.status, (bad.body as { error: { message: string } }).error.message]).toEqual([
      400,
      'steer precisa ser verdadeiro ou falso.'
    ]);
  });

  it('remover a orientação pela porta e o aviso no SSE', async () => {
    const res = await handle(engine, req('GET', '/_chat/assistant/_events'));
    const it = res.stream![Symbol.asyncIterator]();
    expect((await it.next()).value).toBe('event: ready\ndata: {}\n\n');
    expect((await handle(engine, req('DELETE', `${URI}/s1`))).status).toBe(204);
    const conflict = await handle(engine, req('DELETE', `${URI}/u9`));
    expect([conflict.status, (conflict.body as { error: { message: string } }).error.message]).toEqual([
      409,
      'O agente já leu esta mensagem.'
    ]);
    await handle(engine, req('POST', URI, { clientId: 'c1', text: 'parado', steer: true }));
    const sse = (name: string, data: unknown) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
    expect((await it.next()).value).toBe(sse('removed', { type: 'removed', id: 's1', conversationId: 'assistant' }));
    expect((await it.next()).value).toBe(
      sse('notice', { type: 'notice', text: 'O agente já tinha terminado.', tone: 'info', conversationId: 'assistant' })
    );
    await it.return!();
    expect((await handle(engine, req('DELETE', '/_chat/com espaço/messages/s1'))).status).toBe(400);
  });

  it('porta sem remove responde 404', async () => {
    const bare = await buildEngine({ store, app, entities: [note], chat: base });
    const res = await handle(bare, req('DELETE', `${URI}/s1`));
    expect([res.status, (res.body as { error: { message: string } }).error.message]).toEqual([
      404,
      'Este sistema não orienta o agente no meio do trabalho.'
    ]);
  });
});
