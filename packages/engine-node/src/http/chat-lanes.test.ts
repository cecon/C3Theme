import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BetterSqliteStore } from '../adapters/better-sqlite3';
import { buildEngine } from '../app/build';
import { laneInput } from '../app/chat-lanes';
import type { Engine } from '../app/engine';
import type { Chat } from '../ports/chat';
import type { EngineRequest } from '../ports/request';
import { handle } from './handle';

const req = (method: string, path: string, body?: unknown, user = 'ana'): EngineRequest => ({
  method,
  path,
  query: {},
  headers: { 'x-user': user },
  body: body === undefined ? '' : JSON.stringify(body),
  locals: {}
});
const app = { specVersion: '0', name: 'Teste', entities: ['note'] };
const note = { specVersion: '0', name: 'note', label: { singular: 'Nota', plural: 'Notas' }, fields: [{ name: 'text', type: 'string' }] };
const port: Chat = {
  audience: (r) => r.headers['x-user'] ?? '',
  history: () => ({ messages: [], hasMore: false }),
  send: () => ({}),
  answer: () => {},
  answerUi: () => {},
  lanes: (r) => [{ id: `${r.audience}-${r.conversation}` }],
  openLane: (r, body) => ({ id: `${r.audience}-child`, parentId: r.conversation, ...body }),
  messageAction: (r, message, action) => ({ message: `${r.audience}/${r.conversation}/${message}/${action}` })
};

describe('rotas de conversas filhas', () => {
  let dir: string;
  let store: BetterSqliteStore;
  let engine: Engine;
  let bare: Engine;
  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'c3-lanes-'));
    store = new BetterSqliteStore(join(dir, 'test.db'));
    store.database.exec('CREATE TABLE note (id INTEGER PRIMARY KEY, text TEXT)');
    engine = await buildEngine({ store, app, entities: [note], chat: port });
    bare = await buildEngine({
      store,
      app,
      entities: [note],
      chat: { ...port, lanes: undefined, openLane: undefined, messageAction: undefined }
    });
  });
  afterAll(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
  it('manda à porta apenas o usuário e a conversa do pedido', async () => {
    expect((await handle(engine, req('GET', '/_chat/main/_lanes'))).body).toEqual({ data: [{ id: 'ana-main' }] });
    expect((await handle(engine, req('GET', '/_chat/main/_lanes', undefined, 'bob'))).body).toEqual({ data: [{ id: 'bob-main' }] });
    expect((await handle(engine, req('GET', '/_chat/other/_lanes'))).body).toEqual({ data: [{ id: 'ana-other' }] });
  });
  it('abre com 201 e mantém o pai e o usuário; ação vai à mesma sala', async () => {
    const res = await handle(engine, req('POST', '/_chat/main/_lanes', { kind: 'branch', fromMessageId: 'm1' }));
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ data: { id: 'ana-child', parentId: 'main', kind: 'branch', fromMessageId: 'm1' } });
    expect((await handle(engine, req('POST', '/_chat/main/messages/m1/_actions/a1'))).body).toEqual({ message: 'ana/main/m1/a1' });
  });
  it('sem métodos opcionais responde 404, método errado 405, corpo inválido 400', async () => {
    for (const [method, path] of [
      ['GET', '/_chat/main/_lanes'],
      ['POST', '/_chat/main/_lanes'],
      ['POST', '/_chat/main/messages/m1/_actions/a1']
    ]) {
      expect((await handle(bare, req(method, path))).status).toBe(404);
    }
    expect((await handle(engine, req('DELETE', '/_chat/main/_lanes'))).status).toBe(405);
    expect((await handle(engine, req('POST', '/_chat/main/_lanes', { kind: 'branch' }))).status).toBe(400);
    expect((await handle(engine, req('GET', '/_chat/invalid space/_lanes'))).status).toBe(400);
  });
});

it('valida kind, origem e texto antes de chamar a porta', () => {
  expect(laneInput({ kind: 'aside' })).toEqual({ kind: 'aside' });
  expect(laneInput({ kind: 'aside', text: '', fromMessageId: 'm1' })).toEqual({ kind: 'aside', text: '', fromMessageId: 'm1' });
  for (const bad of [
    {},
    { kind: 'x' },
    { kind: 'branch' },
    { kind: 'aside', fromMessageId: '' },
    { kind: 'aside', fromMessageId: 1 },
    { kind: 'aside', text: 1 },
    { kind: 'aside', text: 'x'.repeat(20001) },
    { kind: 'aside', audience: 'other' }
  ])
    expect(() => laneInput(bad)).toThrow();
});
