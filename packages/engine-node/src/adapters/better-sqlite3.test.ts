import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { inTx } from '../ports/store';
import { BetterSqliteStore } from './better-sqlite3';
import { sqliteRegexp } from './regexp';

describe('BetterSqliteStore', () => {
  let dir: string;
  let store: BetterSqliteStore;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'engine-node-'));
    store = new BetterSqliteStore(join(dir, 't.db'));
    store.database.exec(
      'CREATE TABLE a (id INTEGER PRIMARY KEY, name TEXT UNIQUE, price REAL);' +
        'CREATE TABLE b (id INTEGER PRIMARY KEY, a_id INTEGER REFERENCES a(id))'
    );
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('não aceita banco em memória', () => {
    expect(() => new BetterSqliteStore(':memory:')).toThrow();
  });

  it('classifica único e chave estrangeira', async () => {
    await inTx(store, (t) => t.execute("INSERT INTO a (id, name) VALUES (1, 'x')"));
    await inTx(store, (t) => t.execute('INSERT INTO b (a_id) VALUES (1)'));
    await expect(inTx(store, (t) => t.execute("INSERT INTO a (name) VALUES ('x')"))).rejects.toMatchObject({ kind: 'unique' });
    await expect(inTx(store, (t) => t.execute('DELETE FROM a WHERE id = 1'))).rejects.toMatchObject({ kind: 'foreign_key' });
  });

  it('desfaz a transação que falhou e a leitura não vê o que está em andamento', async () => {
    await expect(
      inTx(store, async (t) => {
        await t.execute("INSERT INTO a (name) VALUES ('some')");
        const conn = await store.conn();
        expect(await conn.query("SELECT COUNT(*) FROM a WHERE name = 'some'")).toEqual([[0]]);
        throw new Error('falhou');
      })
    ).rejects.toThrow('falhou');
    const conn = await store.conn();
    expect(await conn.query("SELECT COUNT(*) FROM a WHERE name = 'some'")).toEqual([[0]]);
  });

  it('transações em paralelo entram uma por vez', async () => {
    const order: string[] = [];
    const slow = inTx(store, async (t) => {
      await new Promise((r) => setTimeout(r, 20));
      await t.execute("INSERT INTO a (name) VALUES ('lenta')");
      order.push('lenta');
    });
    const fast = inTx(store, async (t) => {
      await t.execute("INSERT INTO a (name) VALUES ('rápida')");
      order.push('rápida');
    });
    await Promise.all([slow, fast]);
    expect(order).toEqual(['lenta', 'rápida']);
  });

  it('REAL volta como texto', async () => {
    await inTx(store, (t) => t.execute("INSERT INTO a (name, price) VALUES ('real', 1.5)"));
    const conn = await store.conn();
    expect(await conn.query("SELECT price FROM a WHERE name = 'real'")).toEqual([['1.5']]);
  });
});

describe('sqliteRegexp', () => {
  it('(?i) ignora maiúsculas, inclusive acentuadas', () => {
    expect(sqliteRegexp('(?i)^joão', 'JOÃO Silva')).toBe(1);
    expect(sqliteRegexp('^joão', 'JOÃO')).toBe(0);
  });
  it('NULL não casa', () => {
    expect(sqliteRegexp('.*', null)).toBe(0);
  });
});
