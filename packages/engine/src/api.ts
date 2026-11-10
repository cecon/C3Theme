// Cliente do contrato HTTP (spec/v0/openapi.yaml). Não sabe nada de React.

import type { ActionPreview } from './actionTypes';
import type { AggregateItem, AggregateParams } from './dashboard';
import { readSse, type LiveMessage } from './live/sse';
import { browserFetch, type C3Fetch } from './transport';
import type {
  ActionResult,
  AppDef,
  BulkResult,
  Capabilities,
  Condition,
  EntityDef,
  FieldErrors,
  ListResult,
  OrgContext,
  WireRecord
} from './types';

export interface RefusedRecord {
  id: string;
  error: { code: string; message: string; fields?: FieldErrors };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: FieldErrors,
    /** Ação em conjunto recusada (`refused`): o erro de cada registro barrado. */
    public records?: RefusedRecord[]
  ) {
    super(message);
  }
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  q?: string;
  where?: Condition;
  /** Filiais em exibição (entidade com scope). Ausente: a filial ativa. */
  branches?: string[];
  /** Parâmetros da consulta do sistema (`source: system`), já em texto: vão como `p.<nome>`. */
  params?: Record<string, string>;
}

/** Controle otimista e Desfazer (spec/README.md, "Versão e Desfazer"). */
export interface WriteOptions {
  /** `_version` do registro como a tela o viu: se mudou, o backend responde 412 `stale` e nada grava. */
  ifMatch?: string;
  /** Pedido de Desfazer (`C3-Undo`): exige `ifMatch`; o backend confere `undoable` e `inverse`. */
  undo?: boolean;
}

/** 412: o registro mudou depois que a tela o leu. */
export const isStale = (e: unknown) => e instanceof ApiError && e.status === 412;

export interface C3Client {
  app(): Promise<AppDef>;
  /** GET /_meta/app inteiro: a spec e, para cada página com `permission`, se o usuário abre na filial do cabeçalho. */
  meta(): Promise<{ app: AppDef; pageAccess: Record<string, boolean> }>;
  /** Só o `pages` de GET /_meta/app (de novo, depois de escolher ou trocar a filial). */
  pageAccess(): Promise<Record<string, boolean>>;
  context(): Promise<OrgContext>;
  entity(name: string): Promise<{ data: EntityDef; capabilities: Capabilities; paramDefaults?: WireRecord }>;
  list(entity: string, params?: ListParams): Promise<ListResult>;
  /** Contagem ou soma, agrupada ou não, com o filtro da lista (painel). */
  aggregate(entity: string, params?: AggregateParams): Promise<AggregateItem[]>;
  get(entity: string, id: string): Promise<WireRecord>;
  create(entity: string, record: WireRecord): Promise<WireRecord>;
  update(entity: string, id: string, patch: WireRecord, opts?: WriteOptions): Promise<WireRecord>;
  remove(entity: string, id: string, opts?: WriteOptions): Promise<void>;
  /** Roda uma ação de `entity.actions` sobre o registro. `input` vai no formato trafegado. */
  action(entity: string, id: string, action: string, input?: WireRecord, opts?: WriteOptions): Promise<ActionResult>;
  /** A mesma ação, com o mesmo input, em cada id (até 100). Cada registro passa ou falha sozinho. */
  bulkAction(entity: string, action: string, ids: string[], input?: WireRecord): Promise<BulkResult>;
  /** Ação em conjunto (`bulk: 'together'`): uma execução sobre todos os ids, tudo ou nada. */
  togetherAction(entity: string, action: string, ids: string[], input?: WireRecord): Promise<ActionResult>;
  /** Ação da lista (`target: list`), sem registro. */
  listAction(entity: string, action: string, input?: WireRecord): Promise<ActionResult>;
  /** Prévia de uma ação `preview` com o input como está (sem `id`: ação da lista, ou a seleção em `ids`). Nada é gravado. */
  preview(entity: string, action: string, id: string | undefined, input: WireRecord, ids?: string[]): Promise<ActionPreview>;
  /** Valores iniciais do input de uma ação `prefill` (sem `id`: ação da lista). Nada é gravado. */
  prefill(entity: string, action: string, id?: string): Promise<WireRecord>;
  /** Consulta de `entity.lookups`: devolve só os campos que dá para preencher. Nada é gravado. */
  lookup(entity: string, name: string, value: string): Promise<WireRecord>;
  /** Bytes do arquivo gravado num campo `file` do registro. */
  file(entity: string, id: string, field: string): Promise<Blob>;
  /** Tempo real (`live`): lê GET /{entity}/_events até o servidor fechar ou o `signal` abortar. */
  events?(entity: string, onMessage: (m: LiveMessage) => void, signal: AbortSignal): Promise<void>;
  /** Sino (`header.notifications`): GET /_notifications, os avisos do usuário logado e quantos não leu. */
  notifications?(limit?: number): Promise<NotificationList>;
  /** POST /_notifications/_read: marca como lidos os `ids` (sem ids, todos). Devolve quantos sobraram não lidos. */
  readNotifications?(ids?: string[]): Promise<{ unread: number }>;
  /** GET /_notifications/_events (SSE): `ready`, depois um `notification` por aviso novo para o usuário. */
  notificationEvents?(onMessage: (m: LiveMessage) => void, signal: AbortSignal): Promise<void>;
  /** Ctrl K com `header.search: { records: true }`: GET /_search, registros e mensagens que o sistema acha. */
  search?(q: string, limit: number, signal?: AbortSignal): Promise<SearchResult[]>;
}

/** Um achado de GET /_search (spec/v0/search.yaml). `group` agrupa na paleta; `path` é a rota da shell. */
export interface SearchResult {
  kind: string;
  group: string;
  title: string;
  snippet?: string | null;
  path: string;
  icon?: string | null;
  at?: string | null;
}

/** Aviso do sino (spec/v0/notifications.yaml). `readAt` null: não lido. `to`: rota da shell aberta ao clicar. */
export interface C3Notification {
  id: string;
  title: string;
  description?: string;
  tone?: 'neutral' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';
  createdAt: string;
  readAt: string | null;
  to?: string;
}

export interface NotificationList {
  items: C3Notification[];
  unread: number;
}

/**
 * @param apiUrl base da API, ex.: '/api'
 * @param headers cabeçalhos extras por requisição (ex.: Authorization do sistema)
 * @param onUnauthorized chamado num 401 (sessão expirada): a shell com `auth` volta ao login
 * @param fetch transporte do pedido (padrão: o `fetch` do navegador; no Electron, `ipcFetch` de @c3theme/electron)
 */
export function createClient(
  apiUrl: string,
  headers?: () => HeadersInit,
  onUnauthorized?: () => void,
  fetch: C3Fetch = browserFetch
): C3Client {
  const base = apiUrl.replace(/\/$/, '');

  async function call<T>(method: string, path: string, body?: unknown, opts: WriteOptions = {}, signal?: AbortSignal): Promise<T> {
    let res: Response;
    const write = {
      ...(opts.ifMatch && { 'if-match': `"${opts.ifMatch}"` }),
      ...(opts.undo && { 'c3-undo': 'true' })
    };
    try {
      res = await fetch(base + path, {
        method,
        headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...write, ...headers?.() },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal
      });
    } catch {
      throw new ApiError(0, 'network', 'Sem conexão com o servidor.');
    }
    if (res.status === 204) return undefined as T;
    if (res.status === 401) onUnauthorized?.();
    // ação `returns: "file"`: o corpo é o arquivo, e o aviso vem no cabeçalho
    if (res.ok && !res.headers.get('content-type')?.includes('json')) return (await fileReply(res)) as T;
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const err = json?.error;
      throw new ApiError(res.status, err?.code ?? 'internal', err?.message ?? `Erro ${res.status}.`, err?.fields, err?.records);
    }
    return json as T;
  }

  async function blob(path: string): Promise<Blob> {
    const res = await fetch(base + path, { headers: headers?.() }).catch(() => {
      throw new ApiError(0, 'network', 'Sem conexão com o servidor.');
    });
    if (res.ok) return res.blob();
    const err = (await res.json().catch(() => null))?.error;
    throw new ApiError(res.status, err?.code ?? 'internal', err?.message ?? `Erro ${res.status}.`);
  }

  async function stream(path: string, onMessage: (m: LiveMessage) => void, signal: AbortSignal): Promise<void> {
    const res = await fetch(base + path, { headers: { accept: 'text/event-stream', ...headers?.() }, signal });
    if (res.status === 401) onUnauthorized?.();
    if (!res.ok || !res.body) throw new ApiError(res.status, 'internal', `Erro ${res.status}.`);
    await readSse(res.body, onMessage);
  }

  const e = encodeURIComponent;

  return {
    app: () => call<{ data: AppDef }>('GET', '/_meta/app').then((r) => r.data),
    meta: () =>
      call<{ data: AppDef; pages?: Record<string, boolean> }>('GET', '/_meta/app').then((r) => ({
        app: r.data,
        pageAccess: r.pages ?? {}
      })),
    pageAccess: () => call<{ pages?: Record<string, boolean> }>('GET', '/_meta/app').then((r) => r.pages ?? {}),
    context: () => call<{ data: OrgContext }>('GET', '/_meta/context').then((r) => r.data),
    entity: (name) => call('GET', `/_meta/entities/${e(name)}`),
    list: (entity, params = {}) => {
      const q = new URLSearchParams();
      if (params.page) q.set('page', String(params.page));
      if (params.pageSize) q.set('pageSize', String(params.pageSize));
      if (params.sort) q.set('sort', params.sort);
      if (params.q) q.set('q', params.q);
      if (params.where) q.set('where', JSON.stringify(params.where));
      if (params.branches?.length) q.set('branches', params.branches.join(','));
      for (const [k, v] of Object.entries(params.params ?? {})) q.set(`p.${k}`, v);
      return call<ListResult>('GET', `/${e(entity)}?${q}`);
    },
    aggregate: (entity, params = {}) => {
      const q = new URLSearchParams();
      if (params.measure) q.set('measure', [params.measure].flat().join(','));
      if (params.groupBy) q.set('groupBy', params.groupBy);
      if (params.interval) q.set('interval', params.interval);
      if (params.where) q.set('where', JSON.stringify(params.where));
      if (params.q) q.set('q', params.q);
      if (params.branches?.length) q.set('branches', params.branches.join(','));
      for (const [k, v] of Object.entries(params.params ?? {})) q.set(`p.${k}`, v);
      return call<{ data: AggregateItem[] }>('GET', `/${e(entity)}/_aggregate?${q}`).then((r) => r.data);
    },
    get: (entity, id) => call<{ data: WireRecord }>('GET', `/${e(entity)}/${e(id)}`).then((r) => r.data),
    create: (entity, record) => call<{ data: WireRecord }>('POST', `/${e(entity)}`, record).then((r) => r.data),
    update: (entity, id, patch, opts) => call<{ data: WireRecord }>('PATCH', `/${e(entity)}/${e(id)}`, patch, opts).then((r) => r.data),
    remove: (entity, id, opts) => call<void>('DELETE', `/${e(entity)}/${e(id)}`, undefined, opts),
    action: (entity, id, action, input = {}, opts) =>
      call<ActionResult>('POST', `/${e(entity)}/${e(id)}/_actions/${e(action)}`, input, opts),
    bulkAction: (entity, action, ids, input = {}) => call<BulkResult>('POST', `/${e(entity)}/_actions/${e(action)}`, { ids, input }),
    togetherAction: (entity, action, ids, input = {}) => call<ActionResult>('POST', `/${e(entity)}/_actions/${e(action)}`, { ids, input }),
    listAction: (entity, action, input = {}) => call<ActionResult>('POST', `/${e(entity)}/_actions/${e(action)}`, { input }),
    preview: (entity, action, id, input, ids) =>
      id
        ? call<ActionPreview>('POST', `/${e(entity)}/${e(id)}/_actions/${e(action)}/_preview`, input)
        : call<ActionPreview>('POST', `/${e(entity)}/_actions/${e(action)}/_preview`, ids ? { ids, input } : { input }),
    prefill: (entity, action, id) =>
      call<{ data: WireRecord }>('GET', `/${e(entity)}${id ? `/${e(id)}` : ''}/_actions/${e(action)}/_prefill`).then((r) => r.data),
    file: (entity, id, field) => blob(`/${e(entity)}/${e(id)}/_files/${e(field)}`),
    events: (entity, onMessage, signal) => stream(`/${e(entity)}/_events`, onMessage, signal),
    notifications: (limit) => call<NotificationList>('GET', `/_notifications${limit ? `?limit=${limit}` : ''}`),
    readNotifications: (ids) => call<{ unread: number }>('POST', '/_notifications/_read', ids ? { ids } : {}),
    notificationEvents: (onMessage, signal) => stream('/_notifications/_events', onMessage, signal),
    search: (q, limit, signal) =>
      call<{ data: SearchResult[] }>('GET', `/_search?${new URLSearchParams({ q, limit: String(limit) })}`, undefined, {}, signal).then(
        (r) => r.data
      ),
    lookup: (entity, name, value) => call<{ data: WireRecord }>('POST', `/${e(entity)}/_lookups/${e(name)}`, { value }).then((r) => r.data)
  };
}

/** Resposta que é arquivo: nome do `Content-Disposition` (RFC 6266) e aviso do `C3-Message`, ambos em UTF-8 com %XX. */
async function fileReply(res: Response): Promise<ActionResult> {
  const decode = (v: string | null | undefined) => {
    if (!v) return undefined;
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };
  const disposition = res.headers.get('content-disposition') ?? '';
  const name = decode(/filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1]) ?? /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? 'arquivo';
  return { file: { name, blob: await res.blob() }, message: decode(res.headers.get('c3-message')) ?? null };
}
