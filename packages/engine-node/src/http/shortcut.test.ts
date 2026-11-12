import { mkdtempSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BetterSqliteStore } from '../adapters/better-sqlite3';
import { buildEngine } from '../app/build';
import { engineListener } from './node-http';

// Atalho de teclado (`format: "shortcut"`, #110): forma canônica e sem repetir dentro do registro, como no c3-engine.
const dir = mkdtempSync(join(tmpdir(), 'engine-node-shortcut-'));
let server: Server;
let base = '';

beforeAll(async () => {
  const store = new BetterSqliteStore(join(dir, 'prefs.db'));
  store.database.exec('CREATE TABLE prefs (id INTEGER PRIMARY KEY, search TEXT, palette TEXT)');
  const engine = await buildEngine({
    store,
    app: { specVersion: '0', name: 't', entities: ['prefs'] },
    entities: [
      {
        specVersion: '0',
        name: 'prefs',
        label: { singular: 'Preferência', plural: 'Preferências' },
        fields: [
          { name: 'search', type: 'string', format: 'shortcut' },
          { name: 'palette', type: 'string', format: 'shortcut' }
        ]
      }
    ]
  });
  server = createServer(engineListener(engine, { prefix: '/api' }));
  await new Promise<void>((r) => server.listen(0, r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});
afterAll(() => {
  server.close();
  rmSync(dir, { recursive: true, force: true });
});

async function send(method: string, path: string, body: unknown) {
  const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { status: r.status, body: (await r.json()) as { data?: { id: string }; error?: { fields?: Record<string, { code: string }[]> } } };
}
const code = (b: Awaited<ReturnType<typeof send>>['body'], f: string) => b.error?.fields?.[f]?.[0]?.code;

describe('atalho de teclado', () => {
  it('grava a forma canônica, recusa a errada e a repetida no registro, também no PATCH', async () => {
    const ok = await send('POST', '/prefs', { search: 'Ctrl+Shift+K', palette: 'F5' });
    expect(ok.status).toBe(201);
    const id = ok.body.data!.id;

    const wrong = await send('POST', '/prefs', { search: 'Shift+Ctrl+K' });
    expect([wrong.status, code(wrong.body, 'search')]).toEqual([422, 'pattern']);

    const twice = await send('POST', '/prefs', { search: 'Ctrl+K', palette: 'Ctrl+K' });
    expect([twice.status, code(twice.body, 'palette'), code(twice.body, 'search')]).toEqual([422, 'unique', undefined]);

    const patch = await send('PATCH', `/prefs/${id}`, { palette: 'Ctrl+Shift+K' });
    expect([patch.status, code(patch.body, 'palette')]).toEqual([422, 'unique']);
  });
});
