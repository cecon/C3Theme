// Adaptador em memória da porta C3Client: o contrato HTTP (spec/v0/openapi.yaml) sem servidor. Serve para vitrine
// estática, protótipo e teste de tela. Não tem regra de negócio do sistema: ação só roda com o handler que quem monta
// passa em `actions`; sem ele, e em prévias, consultas e arquivos, a resposta é 501, que a shell mostra como erro comum.

import type { ChatTransport } from '@c3theme/chat';

import { ApiError, C3Client, type C3Notification } from '../api';
import type { ActionPreview } from '../actionTypes';
import type { ActionResult, AppDef, BulkItem, Capabilities, EntityDef, WireRecord } from '../types';
import { memoryNotifications } from './notifications';
import { aggregate, list } from './query';
import { memoryRaw } from './raw';
import { memorySearch } from './search';
import { def, fail, fromInput, fromSeed, saveChildren, Store, toWire, validate, validateChildren, withParentChildren } from './records';

export interface MemorySeed {
  app: AppDef;
  /** Definições das entidades, como os arquivos {entidade}.json da spec. */
  entities: EntityDef[];
  /** Registros iniciais por entidade, no formato trafegado (reference pode vir só com o id). */
  records?: Record<string, WireRecord[]>;
  /** O que o usuário pode em cada entidade; ausente, tudo. */
  capabilities?: Record<string, Partial<Capabilities>>;
  /** Atraso de cada resposta, em ms, para ver skeleton e "salvando". Padrão 0. */
  latency?: number;
  /** Relógio das datas relativas dos filtros. Padrão: agora. */
  now?: () => Date;
  /**
   * Regra das ações, no lugar do backend: `actions.fatura.marcar_paga = (registro, input) => ({ status: 'paga' })`.
   * Devolve o que muda no registro; erro lançado vira a falha daquele id. Em lote, roda um por um.
   */
  actions?: Record<string, Record<string, MemoryAction>>;
  /**
   * Ações da lista (`target: list`), no lugar do backend: `listActions.vendedor.revisar = (input, cursor) => ({ message })`.
   * Na ação `steps`, devolva `progress` e receba o `cursor` da etapa anterior.
   */
  listActions?: Record<string, Record<string, (input: WireRecord, cursor: unknown) => ActionResult | Promise<ActionResult>>>;
  /** Prévias (`preview: true`), no lugar do backend: `previews.entrega.imprimir = (input, id) => ({ table })`. */
  previews?: Record<string, Record<string, (input: WireRecord, id?: string) => ActionPreview>>;
  /** Consultas (`lookups`), no lugar do backend: `lookups.orcamento.media = (valor, with) => ({ mes_01: '150.00' })`. */
  lookups?: Record<string, Record<string, (value: string, withValues: WireRecord) => WireRecord>>;
  /** Consulta do sistema: as colunas pelos parâmetros (`meta.columns`, #60), `sourceColumns.dre = (params) => [...]`. */
  sourceColumns?: Record<string, (params: Record<string, string>) => { field: string; label?: string }[] | undefined>;
  /** Avisos do sino (`header.notifications`). Sem eles, o sino aparece vazio. */
  notifications?: C3Notification[];
  /**
   * O que o sistema grava sozinho depois de cada inclusão ou alteração, no lugar do backend: `onSave.fatura =
   * (registro com as filhas) => ({ total: '1250.00' })`. Vale também para campo readOnly.
   */
  onSave?: Record<string, (record: WireRecord) => WireRecord>;
  /** O agente do chat (`pages[].chat`, `header.assistant`), no lugar das rotas /_chat: ex. o `memoryTransport` do @c3theme/chat. */
  chat?: ChatTransport;
  /** Respostas de GET por caminho, para o pedido livre (`raw`): `{ '/openapi.json': doc }` na página apiDocs. */
  files?: Record<string, unknown>;
}

export type MemoryAction = (record: WireRecord, input: WireRecord) => WireRecord;

const ALL: Capabilities = { list: true, read: true, create: true, update: true, delete: true };

const unsupported = (what: string) => {
  throw new ApiError(501, 'not_implemented', `${what} precisa do backend do sistema; o adaptador em memória não roda.`);
};

/** `default` fixo de cada parâmetro da consulta do sistema (o relativo, `{$date}`, fica com o backend). */
const paramDefaults = (d: EntityDef): WireRecord | undefined =>
  d.source === 'system'
    ? Object.fromEntries((d.params?.fields ?? []).flatMap((f) => (typeof f.default === 'string' ? [[f.name, f.default]] : [])))
    : undefined;

export function createMemoryClient(seed: MemorySeed): C3Client {
  let seq = 0;
  const store: Store = {
    defs: Object.fromEntries(seed.entities.map((e) => [e.name, e])),
    tables: {},
    nextId: () => `m${++seq}`
  };
  for (const [entity, rows] of Object.entries(seed.records ?? {}))
    store.tables[entity] = rows.map((r) => ({ ...fromSeed(def(store, entity), r), id: String(r.id ?? store.nextId()) }));

  const now = seed.now ?? (() => new Date());
  const bell = memoryNotifications(seed.notifications ?? [], now);
  const wait = <T>(fn: () => T): Promise<T> =>
    new Promise((resolve, reject) =>
      setTimeout(() => {
        try {
          resolve(fn());
        } catch (e) {
          reject(e);
        }
      }, seed.latency ?? 0)
    );

  const capabilities = (entity: string): Capabilities => {
    const actions = Object.fromEntries((def(store, entity).actions ?? []).map((a) => [a.name, true]));
    // consulta do sistema é só leitura, como no backend
    const readOnly = def(store, entity).source === 'system' ? { create: false, update: false, delete: false } : {};
    return { ...ALL, actions, ...readOnly, ...seed.capabilities?.[entity] };
  };
  const find = (entity: string, id: string) => {
    const row = (store.tables[entity] ?? []).find((r) => r.id === id);
    if (!row) throw new ApiError(404, 'not_found', 'Registro não encontrado.');
    return row;
  };
  // ação com handler: aplica o que ele devolve, com a mesma validação da alteração
  const run = (entity: string, id: string, name: string, input: WireRecord) => {
    const handler = seed.actions?.[entity]?.[name];
    if (!handler) return unsupported('A ação');
    const d = def(store, entity);
    const row = find(entity, id);
    const next = fromInput(d, handler(toWire(store, entity, row), input), row);
    check(entity, d, next, {});
    Object.assign(row, next);
    return toWire(store, entity, row);
  };
  const derive = (entity: string, row: WireRecord) => {
    const handler = seed.onSave?.[entity];
    if (handler) Object.assign(row, handler(toWire(store, entity, row)));
  };
  // `row`: o registro como ficaria gravado; `input`: o corpo, com as listas with_parent
  const check = (entity: string, d: EntityDef, row: WireRecord, input: WireRecord) => {
    const errors = { ...validate(d, row), ...validateChildren(store, entity, input) };
    if (Object.keys(errors).length) fail(errors);
  };

  const client: C3Client = {
    app: () => wait(() => seed.app),
    meta: () => wait(() => ({ app: seed.app, pageAccess: {} })),
    pageAccess: () => wait(() => ({})),
    context: () => wait(() => ({ organization: null, companies: [], branches: [], activeBranch: null, defaultBranch: null })),
    entity: (name) =>
      wait(() => ({ data: def(store, name), capabilities: capabilities(name), paramDefaults: paramDefaults(def(store, name)) })),
    list: (entity, params = {}) =>
      wait(() => {
        const res = list(store, entity, params, now());
        const columns = seed.sourceColumns?.[entity]?.(params.params ?? {});
        return columns ? { ...res, meta: { ...res.meta, columns } } : res;
      }),
    aggregate: (entity, params = {}) => wait(() => aggregate(store, entity, params, now())),
    get: (entity, id) => wait(() => toWire(store, entity, find(entity, id))),
    create: (entity, record) =>
      wait(() => {
        const d = def(store, entity);
        const row = { ...fromInput(d, record, {}, true), id: store.nextId() };
        check(entity, d, row, record);
        (store.tables[entity] ??= []).push(row);
        saveChildren(store, entity, row.id, record);
        derive(entity, row);
        return toWire(store, entity, row);
      }),
    update: (entity, id, patch) =>
      wait(() => {
        const d = def(store, entity);
        const row = find(entity, id);
        const next = fromInput(d, patch, row);
        check(entity, d, next, patch);
        Object.assign(row, next);
        saveChildren(store, entity, id, patch);
        derive(entity, row);
        return toWire(store, entity, row);
      }),
    remove: (entity, id) =>
      wait(() => {
        find(entity, id);
        store.tables[entity] = store.tables[entity].filter((r) => r.id !== id);
        for (const [child, field] of withParentChildren(def(store, entity)))
          store.tables[child] = (store.tables[child] ?? []).filter((r) => String(r[field]) !== id);
      }),
    action: (entity, id, name, input = {}) => wait(() => ({ data: run(entity, id, name, input) })),
    bulkAction: (entity, name, ids, input = {}) =>
      wait(() => {
        const results: BulkItem[] = ids.map((id) => {
          try {
            return { id, ok: true as const, data: run(entity, id, name, input) };
          } catch (e) {
            const err = e instanceof ApiError ? e : new ApiError(500, 'error', String(e));
            return { id, ok: false as const, error: { code: err.code, message: err.message } };
          }
        });
        const ok = results.filter((r) => r.ok).length;
        return { results, meta: { ok, failed: ids.length - ok } };
      }),
    togetherAction: () => wait(() => unsupported('A ação')),
    listAction: (entity, name, input = {}, cursor) =>
      wait(() => {
        const handler = seed.listActions?.[entity]?.[name];
        return handler ? handler(input, cursor) : unsupported('A ação');
      }).then((r) => r),
    preview: (entity, name, id, input = {}) =>
      wait(() => {
        const handler = seed.previews?.[entity]?.[name];
        return handler ? { fill: {}, ...handler(input, id) } : unsupported('A prévia');
      }),
    prefill: () => wait(() => ({})),
    lookup: (entity, name, value, withValues = {}) =>
      wait(() => {
        const handler = seed.lookups?.[entity]?.[name];
        return handler ? handler(value, withValues) : unsupported('A consulta');
      }),
    file: () => wait(() => unsupported('O arquivo')),
    notifications: (limit) => wait(() => bell.list(limit)),
    readNotifications: (ids) => wait(() => bell.read(ids)),
    search: (q, limit) => wait(() => memorySearch(store, q, limit)),
    chat: seed.chat
  };
  client.raw = memoryRaw(
    client,
    seed.entities.map((e) => e.name),
    seed.files
  );
  return client;
}
