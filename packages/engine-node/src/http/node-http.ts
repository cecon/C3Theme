// `node:http` para o contrato: `createServer(engineListener(engine, { prefix: '/api' }))`. Lê o corpo (até 2 MB, ou o
// que o `maxUploadSize` do app pede, como o c3-engine), monta o `EngineRequest` e escreve a resposta, inclusive o SSE do tempo real.

import type { IncomingMessage, ServerResponse } from 'node:http';

import type { Engine } from '../app/engine';
import { ApiError } from '../domain/errors';
import { bodyLimit } from '../domain/file';
import type { EngineRequest, EngineResponse } from '../ports/request';
import { handle } from './handle';

/** Limite do corpo de um app sem `maxUploadSize`. */
export const MAX_BODY = 2 * 1024 * 1024;

export interface ListenerOptions {
  /** Prefixo das rotas (`/api`); pedido fora dele recebe 404. */
  prefix?: string;
  /** Dados do sistema para os hooks (o usuário da sessão, por exemplo). Pode lançar `ApiError` (401). */
  locals?: (req: IncomingMessage) => Record<string, unknown> | Promise<Record<string, unknown>>;
  /** Rotas do sistema (login, por exemplo), conferidas antes das do motor; undefined passa adiante. */
  routes?: (req: EngineRequest) => EngineResponse | undefined | Promise<EngineResponse | undefined>;
}

/** Lê o corpo até `max` bytes; acima disso, undefined. */
async function readBody(req: IncomingMessage, max: number): Promise<string | undefined> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > max) return undefined;
    chunks.push(c as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function toEngineRequest(
  req: IncomingMessage,
  prefix: string,
  locals: Record<string, unknown>,
  body: string
): Promise<EngineRequest | undefined> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith(prefix)) return undefined;
  const headers: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(req.headers)) headers[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : v;
  return {
    method: req.method ?? 'GET',
    path: url.pathname.slice(prefix.length) || '/',
    query: Object.fromEntries(url.searchParams),
    headers,
    body,
    locals
  };
}

export async function writeResponse(res: ServerResponse, out: EngineResponse): Promise<void> {
  res.writeHead(out.status, out.headers);
  if (out.stream) {
    const keepAlive = setInterval(() => res.write(':\n\n'), 20_000);
    const it = out.stream[Symbol.asyncIterator]();
    res.on('close', () => void it.return?.());
    try {
      for (let n = await it.next(); !n.done && !res.destroyed; n = await it.next()) res.write(n.value);
    } finally {
      clearInterval(keepAlive);
      res.end();
    }
    return;
  }
  if (out.bytes) res.end(Buffer.from(out.bytes));
  else if (out.body !== undefined) res.end(JSON.stringify(out.body));
  else res.end();
}

const send = (res: ServerResponse, e: ApiError) =>
  writeResponse(res, { status: e.status, headers: { 'content-type': 'application/json' }, body: { error: e.body() } });

export function engineListener(engine: Engine, o: ListenerOptions = {}) {
  const prefix = o.prefix ?? '';
  const max = bodyLimit(engine.app.maxUpload);
  const tooLarge = `Corpo grande demais (máx. ${Math.round(max / (1 << 20))} MB).`;
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    try {
      const body = await readBody(req, max);
      if (body === undefined) return await send(res, new ApiError(413, 'payload_too_large', tooLarge));
      const locals = (await o.locals?.(req)) ?? {};
      const r = await toEngineRequest(req, prefix, locals, body);
      if (!r) return await send(res, ApiError.notFound('Rota não existe.'));
      await writeResponse(res, (await o.routes?.(r)) ?? (await handle(engine, r)));
    } catch (e) {
      await send(res, e instanceof ApiError ? e : ApiError.internal());
    }
  };
}
