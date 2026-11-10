import { mkdtempSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import { BetterSqliteStore } from '../adapters/better-sqlite3';
import { buildEngine } from '../app/build';
import { bodyLimit, MAX_FILE_SIZE, UPLOAD_CEILING } from '../domain/file';
import { MAX_BODY, engineListener } from './node-http';

// Teto de upload do app (`maxUploadSize`, X23): o maxSize do campo cabe nele e o corpo do pedido acompanha.
const dir = mkdtempSync(join(tmpdir(), 'engine-node-upload-'));
const servers: Server[] = [];
afterAll(() => {
  for (const s of servers) s.close();
  rmSync(dir, { recursive: true, force: true });
});

const doc = (maxSize: number) => ({
  specVersion: '0',
  name: 'doc',
  label: { singular: 'Doc', plural: 'Docs' },
  fields: [
    { name: 'title', type: 'string' },
    { name: 'attachment', type: 'file', maxSize }
  ]
});

async function build(maxUploadSize: number | undefined, maxSize: number) {
  const store = new BetterSqliteStore(join(dir, `${Math.random()}.db`));
  store.database.exec('CREATE TABLE doc (id INTEGER PRIMARY KEY, title TEXT, attachment TEXT)');
  return buildEngine({
    store,
    app: { specVersion: '0', name: 't', entities: ['doc'], ...(maxUploadSize ? { maxUploadSize } : {}) },
    entities: [doc(maxSize)],
    hooks: { delegatesWrites: () => true }
  });
}

async function postStatus(engine: Awaited<ReturnType<typeof build>>, bytes: number) {
  const server = createServer(engineListener(engine, { prefix: '/api' }));
  servers.push(server);
  await new Promise<void>((r) => server.listen(0, r));
  const { port } = server.address() as AddressInfo;
  const r = await fetch(`http://127.0.0.1:${port}/api/doc`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'x'.repeat(bytes) })
  }).catch(() => undefined);
  return r?.status;
}

describe('teto de upload', () => {
  it('maxSize acima do teto do app não sobe; o app pode subir o teto até 32 MB', async () => {
    await expect(build(undefined, 2 << 20)).rejects.toThrow(/acima do maxUploadSize do app/);
    await expect(build(1000, MAX_FILE_SIZE)).rejects.toThrow(/maxUploadSize entre/);
    await expect(build(UPLOAD_CEILING * 2, MAX_FILE_SIZE)).rejects.toThrow(/maxUploadSize entre/);
    await expect(build(4 << 20, 4 << 20)).resolves.toBeDefined();
  });

  it('o corpo acompanha o teto', async () => {
    expect(bodyLimit(MAX_FILE_SIZE)).toBe(MAX_BODY);
    expect(await postStatus(await build(undefined, MAX_FILE_SIZE), 3 << 20)).toBe(413);
    expect(await postStatus(await build(4 << 20, 4 << 20), 5 << 20)).not.toBe(413);
  });
});
