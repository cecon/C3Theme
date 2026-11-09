import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BetterSqliteStore } from '../adapters/better-sqlite3';
import { Bell } from '../app/bell';
import { buildEngine } from '../app/build';
import type { Engine } from '../app/engine';
import type { Notification, Notifications } from '../ports/notifications';
import type { EngineRequest } from '../ports/request';
import { handle } from './handle';

// Sino (spec/v0/notifications.yaml): sem a porta, 404; com ela, lista do usuário, marcar lido e o SSE do dono.
const app = { specVersion: '0', name: 'Teste', entities: ['note'] };
const note = { specVersion: '0', name: 'note', label: { singular: 'Nota', plural: 'Notas' }, fields: [{ name: 'text', type: 'string' }] };

const req = (method: string, path: string, user = 'ana', body?: unknown, query: Record<string, string> = {}): EngineRequest => ({
  method,
  path,
  query,
  headers: { 'x-user': user, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
  body: body === undefined ? '' : JSON.stringify(body),
  locals: {}
});

function port(): Notifications {
  const items: Notification[] = ['1', '2'].map((id) => ({ id, title: `Aviso ${id}`, createdAt: '2026-11-09T12:00:00Z', readAt: null }));
  const mine = (a: string) => (a === 'ana' ? items : []);
  return {
    audience: (r) => r.headers['x-user'] ?? '',
    list: (a, limit) => ({ items: mine(a).slice(0, limit), unread: mine(a).filter((n) => !n.readAt).length }),
    markRead: (a, ids) => {
      for (const n of mine(a)) if (!ids || ids.includes(n.id)) n.readAt ??= '2026-11-09T13:00:00Z';
      return mine(a).filter((n) => !n.readAt).length;
    }
  };
}

describe('notificações', () => {
  let dir: string;
  let store: BetterSqliteStore;
  let engine: Engine;
  const bell = new Bell();

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'engine-node-bell-'));
    store = new BetterSqliteStore(join(dir, 't.db'));
    store.database.exec('CREATE TABLE note (id INTEGER PRIMARY KEY, text TEXT)');
    engine = await buildEngine({ store, app, entities: [note], notifications: port(), bell });
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('sem a porta, as rotas são 404', async () => {
    const bare = await buildEngine({ store, app, entities: [note] });
    for (const [m, p] of [
      ['GET', '/_notifications'],
      ['POST', '/_notifications/_read'],
      ['GET', '/_notifications/_events']
    ])
      expect((await handle(bare, req(m, p))).status).toBe(404);
  });

  it('lista, valida e marca como lido', async () => {
    const page = await handle(engine, req('GET', '/_notifications', 'ana', undefined, { limit: '1' }));
    expect(page.body).toEqual({ items: [{ id: '1', title: 'Aviso 1', createdAt: '2026-11-09T12:00:00Z', readAt: null }], unread: 2 });
    expect((await handle(engine, req('GET', '/_notifications', 'ana', undefined, { limit: '0' }))).status).toBe(400);
    expect((await handle(engine, req('POST', '/_notifications/_read', 'ana', { ids: ['1'] }))).body).toEqual({ unread: 1 });
    expect((await handle(engine, req('POST', '/_notifications/_read', 'ana', { ids: '1' }))).status).toBe(400);
    expect((await handle(engine, req('POST', '/_notifications/_read', 'ana'))).body).toEqual({ unread: 0 });
    expect((await handle(engine, req('GET', '/_notifications', 'beto'))).body).toEqual({ items: [], unread: 0 });
  });

  it('SSE avisa só o dono e solta o ouvinte ao fechar', async () => {
    const res = await handle(engine, req('GET', '/_notifications/_events'));
    const it = res.stream![Symbol.asyncIterator]();
    expect((await it.next()).value).toContain('event: ready');
    const next = it.next();
    bell.notify('beto');
    bell.notify('ana');
    expect((await next).value).toContain('event: notification');
    const waiting = it.next();
    await it.return!();
    expect((await waiting).done).toBe(true);
  });
});
