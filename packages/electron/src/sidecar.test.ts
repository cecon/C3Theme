import { describe, expect, it } from 'vitest';

import { startSidecar } from './sidecar';

// um "binário" de mentira: Node servindo /api na porta de PORT, como o c3-example
const server = `require('http').createServer((q, r) => { r.setHeader('content-type', 'application/json'); r.end(JSON.stringify({ path: q.url })); }).listen(process.env.PORT, '127.0.0.1')`;

describe('startSidecar', () => {
  it('sobe numa porta livre, espera responder e devolve a base da API', async () => {
    const side = await startSidecar({ command: process.execPath, args: ['-e', server] });
    try {
      expect(side.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/api$/);
      expect(await (await fetch(`${side.url}/_meta/app`)).json()).toEqual({ path: '/api/_meta/app' });
    } finally {
      side.stop();
    }
  });

  it('binário que sai antes de responder vira erro', async () => {
    await expect(startSidecar({ command: process.execPath, args: ['-e', 'process.exit(3)'] })).rejects.toThrow('saiu (código 3)');
  });

  it('binário que não existe vira erro', async () => {
    await expect(startSidecar({ command: '/nao/existe/c3', timeoutMs: 2000 })).rejects.toThrow(/ENOENT/);
  });
});
