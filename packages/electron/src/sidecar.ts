// Backend local: o main sobe o binário do sistema (ex.: c3-engine + SQLite) numa porta livre de 127.0.0.1 e espera
// ele responder. Só Node (child_process, net): fica no processo main.

import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';

export interface SidecarOptions {
  /** Caminho do executável (no app empacotado, dentro de `process.resourcesPath`). */
  command: string;
  args?: string[];
  cwd?: string;
  /** Ambiente extra (ex.: `DATABASE_URL` no `app.getPath('userData')`). A porta vai em `PORT`. */
  env?: Record<string, string>;
  /** Prefixo da API no binário. Padrão: `/api`. */
  apiPath?: string;
  /** Pedido que diz que subiu (qualquer resposta HTTP serve). Padrão: `/_meta/app`. */
  readyPath?: string;
  timeoutMs?: number;
}

export interface Sidecar {
  /** Base da API para o `forwardTo`, ex.: `http://127.0.0.1:53124/api`. */
  url: string;
  process: ChildProcess;
  stop(): void;
}

/** Porta livre agora (o sistema escolhe; há uma janela curta até o binário ocupar). */
export function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      srv.close(() => (addr && typeof addr === 'object' ? resolve(addr.port) : reject(new Error('sem porta'))));
    });
  });
}

export async function startSidecar(opts: SidecarOptions): Promise<Sidecar> {
  const port = await freePort();
  const url = `http://127.0.0.1:${port}${opts.apiPath ?? '/api'}`;
  const child = spawn(opts.command, opts.args ?? [], {
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env, PORT: String(port) },
    stdio: ['ignore', 'inherit', 'inherit']
  });
  const stop = () => {
    if (child.exitCode === null) child.kill();
  };
  try {
    await waitReady(child, url + (opts.readyPath ?? '/_meta/app'), opts.timeoutMs ?? 15_000);
  } catch (e) {
    stop();
    throw e;
  }
  return { url, process: child, stop };
}

async function waitReady(child: ChildProcess, url: string, timeoutMs: number): Promise<void> {
  let failure: Error | undefined;
  child.once('error', (e) => (failure = e));
  child.once('exit', (code) => (failure ??= new Error(`o backend local saiu (código ${code})`)));
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (failure) throw failure;
    const up = await fetch(url).then(
      () => true,
      () => false
    );
    if (up) return;
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`o backend local não respondeu em ${timeoutMs} ms`);
}
