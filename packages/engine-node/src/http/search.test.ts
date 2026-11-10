import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BetterSqliteStore } from '../adapters/better-sqlite3';
import { buildEngine } from '../app/build';
import type { Engine } from '../app/engine';
import type { EngineRequest } from '../ports/request';
import type { Search } from '../ports/search';
import { handle } from './handle';

// Busca do Ctrl K (spec/v0/search.yaml): sem a porta, 404; com ela, q e limit conferidos e a resposta no formato.
const app = { specVersion: '0', name: 'Teste', entities: ['note'] };
const note = { specVersion: '0', name: 'note', label: { singular: 'Nota', plural: 'Notas' }, fields: [{ name: 'text', type: 'string' }] };

const req = (query: Record<string, string>, method = 'GET'): EngineRequest => ({
  method,
  path: '/_search',
  query,
  headers: { 'x-user': 'ana' },
  body: '',
  locals: {}
});

const seen: { user: string | undefined; q: string; limit: number }[] = [];
const port: Search = {
  search: (r, q, limit) => {
    seen.push({ user: r.headers['x-user'], q, limit });
    return Array.from({ length: 30 }, (_, i) => ({ kind: 'note', group: 'Notas', title: `${q} ${i}`, path: `/note/${i}` }));
  }
};

describe('GET /_search', () => {
  let dir: string;
  let store: BetterSqliteStore;
  let engine: Engine;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'engine-node-search-'));
    store = new BetterSqliteStore(join(dir, 't.db'));
    store.database.exec('CREATE TABLE note (id INTEGER PRIMARY KEY, text TEXT)');
    engine = await buildEngine({ store, app, entities: [note], search: port });
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('sem a porta, 404', async () => {
    const bare = await buildEngine({ store, app, entities: [note] });
    expect((await handle(bare, req({ q: 'pao' }))).status).toBe(404);
  });

  it('chama a porta com q aparado e o limit, corta no limit e completa os nulos', async () => {
    const res = await handle(engine, req({ q: '  pão ', limit: '5' }));
    expect(res.status).toBe(200);
    const body = res.body as { data: unknown[] };
    expect(body.data).toHaveLength(5);
    expect(body.data[0]).toEqual({ kind: 'note', group: 'Notas', title: 'pão 0', snippet: null, path: '/note/0', icon: null, at: null });
    expect(seen.at(-1)).toEqual({ user: 'ana', q: 'pão', limit: 5 });
    const plain = (await handle(engine, req({ q: 'pao' }))).body as { data: unknown[] };
    expect(plain.data).toHaveLength(20);
  });

  it('q curto, longo ou limit fora da faixa: 400; outro método: 405', async () => {
    const bad: Record<string, string>[] = [
      {},
      { q: ' a ' },
      { q: 'x'.repeat(201) },
      { q: 'pao', limit: '0' },
      { q: 'pao', limit: '51' },
      { q: 'pao', limit: 'dez' }
    ];
    for (const query of bad) expect((await handle(engine, req(query))).status).toBe(400);
    expect((await handle(engine, req({ q: 'pao' }, 'POST'))).status).toBe(405);
  });
});
