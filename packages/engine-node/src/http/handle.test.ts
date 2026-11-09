import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BetterSqliteStore } from '../adapters/better-sqlite3';
import { buildEngine } from '../app/build';
import type { Engine } from '../app/engine';
import type { EngineRequest } from '../ports/request';
import { handle } from './handle';

const app = { specVersion: '0', name: 'Teste', entities: ['note'] };
const note = {
  specVersion: '0',
  name: 'note',
  label: { singular: 'Nota', plural: 'Notas' },
  titleField: 'name',
  fields: [{ name: 'name', type: 'string', label: 'Nome', required: true, unique: true, maxLength: 20 }],
  views: { list: { columns: ['name'], search: ['name'] } }
};

const req = (method: string, path: string, body?: unknown): EngineRequest => ({
  method,
  path,
  query: {},
  headers: body === undefined ? {} : { 'content-type': 'application/json' },
  body: body === undefined ? '' : JSON.stringify(body),
  locals: {}
});

const json = (body: unknown) => (typeof body === 'string' ? JSON.parse(body) : body) as Record<string, any>;

describe('handle', () => {
  let dir: string;
  let engine: Engine;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'engine-node-'));
    const store = new BetterSqliteStore(join(dir, 't.db'));
    store.database.exec('CREATE TABLE note (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE)');
    engine = await buildEngine({ store, app, entities: [note] });
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('cria, lê e lista com a versão do registro', async () => {
    const created = await handle(engine, req('POST', '/note', { name: 'Primeira' }));
    expect(created.status).toBe(201);
    const id = json(created.body).data.id;
    const read = json((await handle(engine, req('GET', `/note/${id}`))).body).data;
    expect(read.name).toBe('Primeira');
    expect(read._version).toMatch(/^[0-9a-f]{24}$/);
    const list = json((await handle(engine, req('GET', '/note'))).body);
    expect(list.data.map((r: { name: string }) => r.name)).toContain('Primeira');
  });

  it('valida obrigatório, tamanho e único com os erros por campo', async () => {
    const empty = await handle(engine, req('POST', '/note', {}));
    expect(empty.status).toBe(422);
    expect(json(empty.body).error.fields.name[0].code).toBe('required');
    const long = await handle(engine, req('POST', '/note', { name: 'x'.repeat(21) }));
    expect(json(long.body).error.fields.name[0].code).toBe('too_long');
    await handle(engine, req('POST', '/note', { name: 'Dupla' }));
    const dup = await handle(engine, req('POST', '/note', { name: 'Dupla' }));
    expect(dup.status).toBe(409);
    expect(json(dup.body).error.fields.name[0].code).toBe('unique');
  });

  it('rota que não existe é 404 e método errado é 405, em JSON', async () => {
    const missing = await handle(engine, req('GET', '/nada'));
    expect(missing.status).toBe(404);
    expect(json(missing.body).error.code).toBe('not_found');
    const wrong = await handle(engine, req('PATCH', '/_meta/app'));
    expect(wrong.status).toBe(405);
  });
});
