// Listagem e agregação em memória: o mesmo que GET /{entity} e GET /{entity}/_aggregate fazem no backend
// (busca, filtro, ordem, página, contagem e soma), sobre os registros no formato trafegado.

import type { AggregateItem, AggregateParams } from '../dashboard';
import { ApiError, type ListParams } from '../api';
import type { EntityDef, ListResult, WireRecord } from '../types';
import { def, matches, Store, toWire } from './records';
import { browserClock, resolveDates } from '../relativeDate';

const sortValue = (v: unknown): unknown => {
  if (v && typeof v === 'object' && 'title' in v) return (v as { title: unknown }).title ?? '';
  if (typeof v === 'string' && v !== '' && !Number.isNaN(Number(v)) && /^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v ?? '';
};

function compareBy(sort: string) {
  const keys = sort
    .split(',')
    .filter(Boolean)
    .map((k) => (k.startsWith('-') ? { field: k.slice(1), dir: -1 } : { field: k, dir: 1 }));
  return (a: WireRecord, b: WireRecord) => {
    for (const { field, dir } of keys) {
      const x = sortValue(a[field]);
      const y = sortValue(b[field]);
      if (x === y) continue;
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
      return String(x).localeCompare(String(y), 'pt-BR') * dir;
    }
    return 0;
  };
}

function searchable(d: EntityDef, row: WireRecord, q: string): boolean {
  const needle = q.toLowerCase();
  const fields = d.views?.list?.search ?? [];
  return fields.some((name) => {
    const v = row[name];
    const text = v && typeof v === 'object' && 'title' in v ? (v as { title: unknown }).title : v;
    return String(text ?? '')
      .toLowerCase()
      .includes(needle);
  });
}

/** Datas relativas resolvidas; condição recusada vira 400 bad_request, como no backend. */
function withRelativeDates(where: ListParams['where'], d: EntityDef, now: Date) {
  try {
    return resolveDates(where, d, browserClock(now));
  } catch (e) {
    throw new ApiError(400, 'bad_request', (e as Error).message);
  }
}

/** Linhas que o filtro alcança, já no formato trafegado (sem as filhas). */
export function filtered(store: Store, entity: string, params: Pick<ListParams, 'q' | 'where'>, now: Date): WireRecord[] {
  const d = def(store, entity);
  const where = withRelativeDates(params.where, d, now);
  return (store.tables[entity] ?? [])
    .map((r) => toWire(store, entity, r, false))
    .filter((r) => matches(d, r, where) && (!params.q || searchable(d, r, params.q)));
}

export function list(store: Store, entity: string, params: ListParams, now: Date): ListResult {
  const d = def(store, entity);
  const rows = filtered(store, entity, params, now);
  const sort = params.sort ?? (d.views?.list?.defaultSort ?? []).map((s) => (s.direction === 'desc' ? '-' : '') + s.field).join(',');
  if (sort) rows.sort(compareBy(sort));
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? d.views?.list?.pageSize ?? 25;
  return { data: rows.slice((page - 1) * pageSize, page * pageSize), meta: { page, pageSize, total: rows.length } };
}

/** Soma decimal exata o bastante para a vitrine: na escala do campo, devolvida em texto como o campo. */
function measureOf(d: EntityDef, measure: string, rows: WireRecord[]): number | string {
  if (measure === 'count') return rows.length;
  const name = measure.slice(4);
  const field = d.fields.find((f) => f.name === name);
  const sum = rows.reduce((acc, r) => acc + Number(r[name] ?? 0), 0);
  return field?.type === 'decimal' ? sum.toFixed(field.scale ?? 2) : sum;
}

function groupKey(v: unknown, interval: AggregateParams['interval']): { key: AggregateItem['key']; title?: string | null } {
  if (v === null || v === undefined || v === '') return { key: null };
  if (typeof v === 'object' && 'id' in v) {
    const ref = v as { id: string; title: string | null };
    return { key: ref.id, title: ref.title };
  }
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
    const len = interval === 'day' ? 10 : interval === 'year' ? 4 : 7;
    return { key: v.slice(0, len) };
  }
  return { key: v as AggregateItem['key'] };
}

export function aggregate(store: Store, entity: string, params: AggregateParams, now: Date): AggregateItem[] {
  const d = def(store, entity);
  const rows = filtered(store, entity, params, now);
  const measures = [params.measure ?? 'count'].flat();
  const item = (key: AggregateItem['key'], group: WireRecord[], title?: string | null): AggregateItem => {
    const values = measures.map((m) => measureOf(d, m, group));
    return { key, ...(title !== undefined && { title }), value: values[0], ...(values.length > 1 && { values }) };
  };
  if (!params.groupBy) return [item(null, rows)];
  const groups = new Map<AggregateItem['key'], { title?: string | null; rows: WireRecord[] }>();
  for (const r of rows) {
    const { key, title } = groupKey(r[params.groupBy], params.interval);
    const g = groups.get(key) ?? { title, rows: [] };
    g.rows.push(r);
    groups.set(key, g);
  }
  const out = [...groups.entries()].map(([key, g]) => item(key, g.rows, g.title));
  // datas em ordem de tempo; o vazio por último (a shell ordena enum e reference do jeito dela)
  out.sort((a, b) => (a.key === null ? 1 : b.key === null ? -1 : String(a.key).localeCompare(String(b.key))));
  return out.slice(0, 100);
}
