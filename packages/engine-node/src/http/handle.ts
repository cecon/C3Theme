// Adaptador de transporte neutro: um pedido (`EngineRequest`) vira chamada às regras e o resultado (ou o `ApiError`)
// vira a resposta do contrato. Serve ao `node:http` (`node-http.ts`), a um IPC do Electron e aos testes.

import { aggregate } from '../app/aggregate';
import { listNotifications, notificationEvents, readNotifications } from '../app/bell';
import { runAction, runBulk } from '../app/action';
import { prefill } from '../app/action-prefill';
import { preview } from '../app/action-preview';
import type { ActionReply } from '../app/action-reply';
import { remove } from '../app/delete';
import { disposition, download, encodeHeader } from '../app/download';
import type { Engine } from '../app/engine';
import { list } from '../app/list';
import { sseEvents, subscribe } from '../app/live-feed';
import { runLookup } from '../app/lookup';
import { metaApp, metaContext, metaEntity, metaLogin } from '../app/meta';
import { read } from '../app/read';
import { create, update } from '../app/write';
import { ApiError, toApiError } from '../domain/errors';
import { type Rec, isObject } from '../domain/types';
import type { FileContent } from '../ports/hooks';
import type { EngineRequest, EngineResponse } from '../ports/request';

const json = (body: unknown, status = 200): EngineResponse => ({
  status,
  headers: { 'content-type': 'application/json' },
  body
});

const errorResponse = (e: ApiError): EngineResponse => json({ error: e.body() }, e.status);

/** Corpo como JSON; undefined se não for JSON (a regra decide a mensagem). */
function jsonBody(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** Corpo vazio vale como `{}`; fora isso, precisa ser um objeto JSON. Lido só quando a regra pede. */
const objectOrEmpty = (raw: string) => (): Rec => {
  if (raw.trim() === '') return {};
  const v = jsonBody(raw);
  if (!isObject(v)) throw ApiError.badRequest('Corpo precisa ser um objeto JSON.');
  return v;
};

function fileResponse(file: FileContent, message?: string): EngineResponse {
  const headers: Record<string, string> = {
    'content-type': file.contentType && /^[\x20-\x7e]+$/.test(file.contentType) ? file.contentType : 'application/octet-stream',
    'content-disposition': disposition(file.name),
    'x-content-type-options': 'nosniff'
  };
  if (message !== undefined) headers['c3-message'] = encodeHeader(message);
  return { status: 200, headers, bytes: file.data };
}

const actionResponse = (r: ActionReply): EngineResponse => (r.kind === 'file' ? fileResponse(r.file, r.message) : json(r.body));

type Route = (engine: Engine, req: EngineRequest, p: string[]) => Promise<EngineResponse>;

/** Rotas do contrato (spec/v0/openapi.yaml), por método e formato do caminho. Segmento com `_` na frente é fixo. */
function route(method: string, p: string[]): Route | 'method' | undefined {
  const fixed = (i: number, s: string) => p[i] === s;
  const pick = (table: Record<string, Route>): Route | 'method' => table[method] ?? 'method';
  if (p[0] === '_meta') {
    if (p.length === 2 && fixed(1, 'app')) return pick({ GET: async (e, r) => json(await metaApp(e, r)) });
    if (p.length === 2 && fixed(1, 'login')) return pick({ GET: async (e) => json({ data: metaLogin(e) }) });
    if (p.length === 2 && fixed(1, 'context')) return pick({ GET: async (e, r) => json({ data: await metaContext(e, r) }) });
    if (p.length === 3 && fixed(1, 'entities')) return pick({ GET: async (e, r, x) => json(await metaEntity(e, r, x[2])) });
    return undefined;
  }
  if (p[0] === '_notifications') {
    if (p.length === 1) return pick({ GET: async (e, r) => json(await listNotifications(e, r)) });
    if (p.length === 2 && fixed(1, '_read'))
      return pick({ POST: async (e, r) => json(await readNotifications(e, r, objectOrEmpty(r.body)())) });
    if (p.length === 2 && fixed(1, '_events'))
      return pick({
        GET: async (e, r) => ({
          status: 200,
          headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' },
          stream: notificationEvents(e, r)
        })
      });
    return undefined;
  }
  if (p.length === 1)
    return pick({
      GET: async (e, r, x) => {
        const page = await list(e, r, x[0], r.query);
        return json({ data: page.data, meta: { page: page.page, pageSize: page.pageSize, total: page.total } });
      },
      POST: async (e, r, x) => {
        const created = await create(e, r, x[0], jsonBody(r.body));
        e.emit(x[0], String(created.id), 'created');
        return json({ data: created }, 201);
      }
    });
  if (p.length === 2 && fixed(1, '_aggregate'))
    return pick({ GET: async (e, r, x) => json({ data: await aggregate(e, r, x[0], r.query) }) });
  if (p.length === 2 && fixed(1, '_events')) return pick({ GET: events });
  if (p.length === 2)
    return pick({
      GET: async (e, r, x) => json({ data: await read(e, r, x[0], x[1]) }),
      PATCH: async (e, r, x) => {
        const updated = await update(e, r, x[0], x[1], jsonBody(r.body));
        e.emit(x[0], x[1], 'updated');
        return json({ data: updated });
      },
      DELETE: async (e, r, x) => {
        await remove(e, r, x[0], x[1]);
        e.emit(x[0], x[1], 'deleted');
        return { status: 204, headers: {} };
      }
    });
  if (p.length === 3 && fixed(1, '_actions'))
    return pick({ POST: async (e, r, x) => actionResponse(await runBulk(e, r, x[0], x[2], objectOrEmpty(r.body))) });
  if (p.length === 3 && fixed(1, '_lookups'))
    return pick({ POST: async (e, r, x) => json({ data: await runLookup(e, r, x[0], x[2], jsonBody(r.body)) }) });
  if (p.length === 4 && fixed(1, '_actions') && fixed(3, '_prefill'))
    return pick({ GET: async (e, r, x) => json(await prefill(e, r, x[0], undefined, x[2])) });
  if (p.length === 4 && fixed(1, '_actions') && fixed(3, '_preview'))
    return pick({ POST: async (e, r, x) => json(await preview(e, r, x[0], undefined, x[2], objectOrEmpty(r.body))) });
  if (p.length === 4 && fixed(2, '_actions'))
    return pick({ POST: async (e, r, x) => actionResponse(await runAction(e, r, x[0], x[1], x[3], objectOrEmpty(r.body))) });
  if (p.length === 4 && fixed(2, '_files')) return pick({ GET: async (e, r, x) => fileResponse(await download(e, r, x[0], x[1], x[3])) });
  if (p.length === 5 && fixed(2, '_actions') && fixed(4, '_prefill'))
    return pick({ GET: async (e, r, x) => json(await prefill(e, r, x[0], x[1], x[3])) });
  if (p.length === 5 && fixed(2, '_actions') && fixed(4, '_preview'))
    return pick({ POST: async (e, r, x) => json(await preview(e, r, x[0], x[1], x[3], objectOrEmpty(r.body))) });
  return undefined;
}

async function events(engine: Engine, req: EngineRequest, p: string[]): Promise<EngineResponse> {
  const sub = await subscribe(engine, req, p[0]);
  return {
    status: 200,
    headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' },
    stream: sseEvents(engine, req, p[0], sub)
  };
}

/** Atende um pedido do contrato. Nunca lança: erro vira a resposta `{ error }` do contrato. */
export async function handle(engine: Engine, req: EngineRequest): Promise<EngineResponse> {
  let parts: string[];
  try {
    parts = req.path.split('/').filter(Boolean).map(decodeURIComponent);
  } catch {
    return errorResponse(ApiError.badRequest('Caminho inválido.'));
  }
  const r = route(req.method.toUpperCase(), parts);
  if (r === undefined) return errorResponse(ApiError.notFound('Rota não existe.'));
  if (r === 'method') return errorResponse(ApiError.methodNotAllowed('Método não vale nesta rota.'));
  try {
    return await r(engine, req, parts);
  } catch (e) {
    return errorResponse(toApiError(e));
  }
}
