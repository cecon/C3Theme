// Agregação para painéis e totais da lista: contagem ou soma (uma ou várias medidas), opcionalmente agrupada por um
// campo, sobre o mesmo filtro da lista. Campo oculto ao usuário não agrupa nem soma.

import { type Entity, readableField } from '../domain/entity';
import { ApiError } from '../domain/errors';
import type { Field } from '../domain/field';
import type { Rec } from '../domain/types';
import { formatDecimal, intToWire, isIntColumn } from '../domain/value';
import type { EngineRequest } from '../ports/request';
import { type Row, intAt, textAt } from '../ports/store';
import { viewOf } from './access';
import { Ctx } from './ctx';
import type { Engine } from './engine';
import { filtered } from './filter';
import { titleSql } from './read';

export const MAX_GROUPS = 100;
const MAX_MEASURES = 10;

/** `undefined` = contagem; senão o campo somado. */
type Measure = Field | undefined;

function measure(entity: Entity, raw: string): Measure {
  if (raw === 'count') return undefined;
  if (!raw.startsWith('sum:')) throw ApiError.badRequest("'measure' precisa ser 'count' ou 'sum:<campo>'.");
  const name = raw.slice(4);
  const f = readableField(entity, name);
  if (!f || (f.type !== 'integer' && f.type !== 'decimal'))
    throw ApiError.badRequest(`'measure': '${name}' não é campo integer ou decimal.`);
  return f;
}

function measures(entity: Entity, raw: string | undefined): Measure[] {
  if (!raw) return [undefined];
  const list = raw.split(',').map((m) => measure(entity, m.trim()));
  if (list.length > MAX_MEASURES) throw ApiError.badRequest(`'measure': no máximo ${MAX_MEASURES} medidas.`);
  return list;
}

const measureSql = (m: Measure) => (m ? `COALESCE(SUM(t."${m.name}"), 0)` : 'COUNT(*)');
const isDate = (f: Field) => f.type === 'date' || f.type === 'datetime';

function intervalLen(raw: string | undefined): number {
  const len = { month: 7, day: 10, year: 4 }[raw ?? 'month'];
  if (len === undefined) throw ApiError.badRequest("'interval' precisa ser day, month ou year.");
  return len;
}

function groupField(entity: Entity, name: string): Field {
  const f = readableField(entity, name);
  if (!f || !['enum', 'boolean', 'reference', 'date', 'datetime'].includes(f.type))
    throw ApiError.badRequest(`'groupBy': '${name}' não é campo enum, boolean, reference ou data.`);
  return f;
}

/** `value` com a primeira medida; com mais de uma, `values` com todas, na ordem pedida. */
function putValues(item: Rec, ms: Measure[], row: Row, first: number): void {
  const values = ms.map((m, i) => {
    const n = intAt(row, first + i) ?? 0;
    return m?.type === 'decimal' ? formatDecimal(n, m.scale) : n;
  });
  item.value = values[0];
  if (values.length > 1) item.values = values;
}

export async function aggregate(engine: Engine, req: EngineRequest, name: string, q: Record<string, string>): Promise<Rec[]> {
  const ctx = await Ctx.of(engine, req);
  const entity = viewOf(ctx, engine.entity(name));
  const ms = measures(entity, q.measure);
  const g = q.groupBy !== undefined ? groupField(entity, q.groupBy) : undefined;
  if (q.interval !== undefined && !(g && isDate(g))) throw ApiError.badRequest("'interval' só vale com 'groupBy' de data.");
  const len = intervalLen(q.interval);
  const { from, where, params } = await filtered(ctx, entity, q);
  const valuesSql = ms.map(measureSql).join(', ');
  const conn = await engine.storeOf(entity).conn();
  if (!g) {
    const rows = await conn.query(`SELECT ${valuesSql} FROM ${from} t${where}`, params);
    if (!rows.length) throw ApiError.internal();
    const item: Rec = { key: null };
    putValues(item, ms, rows[0], 0);
    return [item];
  }
  const col = `t."${g.name}"`;
  const keySql = isDate(g) ? `substr(${col}, 1, ${len})` : col;
  const title = titleSql(ctx, g);
  // data: em ordem de tempo; o resto: maiores primeiro (pela primeira medida). Vazio sempre por último.
  const order = isDate(g) ? `${keySql} IS NULL, ${keySql} ASC` : `${keySql} IS NULL, ${measureSql(ms[0])} DESC, ${keySql} ASC`;
  const sql = `SELECT ${keySql}, ${valuesSql}${title ? `, ${title}` : ''} FROM ${from} t${where} GROUP BY ${keySql} ORDER BY ${order} LIMIT ${MAX_GROUPS}`;
  return (await conn.query(sql, params)).map((r) => {
    let key: unknown;
    if (isDate(g)) key = textAt(r, 0);
    else if (g.type === 'reference') key = intAt(r, 0) === null ? null : String(intAt(r, 0));
    else if (isIntColumn(g)) key = intToWire(g, intAt(r, 0));
    else key = textAt(r, 0);
    const item: Rec = { key };
    putValues(item, ms, r, 1);
    if (g.type === 'reference') item.title = textAt(r, 1 + ms.length);
    return item;
  });
}
