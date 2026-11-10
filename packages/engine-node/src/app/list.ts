// Lista paginada: o filtro comum (`filter.ts`), ordenação e página.

import { readableField } from '../domain/entity';
import { ApiError } from '../domain/errors';
import type { Rec } from '../domain/types';
import { isIntColumn } from '../domain/value';
import type { EngineRequest } from '../ports/request';
import { scalarInt } from '../ports/store';
import { viewOf } from './access';
import { Ctx } from './ctx';
import type { Engine } from './engine';
import type { SourceColumn } from '../ports/hooks';
import { filtered } from './filter';
import { sourceColumns } from './source';
import { attachCan, rowToJson, selectSql, titleSql } from './read';

const PAGE_SIZES = [10, 25, 50, 100];

export interface Page {
  data: Rec[];
  page: number;
  pageSize: number;
  total: number;
  /** Consulta do sistema: colunas que o sistema pediu para estes parâmetros (#60). */
  columns?: SourceColumn[];
}

function intParam(raw: string | undefined, fallback: number, ok: (n: number) => boolean, message: string): number {
  if (raw === undefined) return fallback;
  const n = /^[+-]?\d+$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isSafeInteger(n) || !ok(n)) throw ApiError.badRequest(message);
  return n;
}

export async function list(engine: Engine, req: EngineRequest, name: string, q: Record<string, string>): Promise<Page> {
  const ctx = await Ctx.of(engine, req);
  // campo que o usuário não vê não é lido, filtrado, buscado nem ordenado
  const entity = viewOf(ctx, engine.entity(name));
  const { from, where, params, sourceParams } = await filtered(ctx, entity, q);
  const page = intParam(q.page, 1, (p) => p >= 1, "'page' precisa ser inteiro >= 1.");
  const pageSize = intParam(q.pageSize, 25, (p) => PAGE_SIZES.includes(p), "'pageSize' precisa ser 10, 25, 50 ou 100.");

  const order: string[] = [];
  for (const key of q.sort !== undefined ? q.sort.split(',') : []) {
    const desc = key.startsWith('-');
    const fname = desc ? key.slice(1) : key;
    const dir = desc ? 'DESC' : 'ASC';
    if (fname === 'id') {
      order.push(`t."id" ${dir}`);
      continue;
    }
    const f = readableField(entity, fname);
    if (!f || f.type === 'file') throw ApiError.badRequest(`'sort': campo inexistente '${fname}'.`);
    // reference ordena pelo título; vazio sempre por último, nos dois sentidos
    const expr = titleSql(ctx, f) ?? `t."${f.name}"`;
    const empty = isIntColumn(f) && f.type !== 'reference' ? `${expr} IS NULL` : `(${expr} IS NULL OR ${expr} = '')`;
    order.push(`${empty}, ${expr} ${dir}`);
  }
  order.push('t."id" ASC');

  const conn = await engine.storeOf(entity).conn();
  const total = (await scalarInt(conn, `SELECT COUNT(*) FROM ${from} t${where}`, params)) ?? 0;
  const sql = `${selectSql(ctx, entity, from)}${where} ORDER BY ${order.join(', ')} LIMIT ? OFFSET ?`;
  const rows = await conn.query(sql, [...params, pageSize, (page - 1) * pageSize]);
  const data = rows.map((r) => rowToJson(entity, r));
  for (const r of data) attachCan(ctx, entity, r);
  const columns = sourceParams ? await sourceColumns(ctx, entity, sourceParams) : undefined;
  return { data, page, pageSize, total, ...(columns && { columns }) };
}
