// Leitura: o SELECT de uma entidade (com títulos de reference e dono), um registro e o registro completo.

import { type Entity, titleFieldOf } from '../domain/entity';
import { ApiError } from '../domain/errors';
import { fileToWire } from '../domain/file';
import type { Field } from '../domain/field';
import { BRANCH_COL, COMPANY_COL, type Rec, type SqlValue } from '../domain/types';
import { intToWire, isIntColumn, parseId } from '../domain/value';
import type { EngineRequest } from '../ports/request';
import { type Conn, type Row, intAt, textAt } from '../ports/store';
import { strip } from './access';
import { attachChildren } from './children';
import { Ctx, allowRead, ownerOf, titleName } from './ctx';
import type { Engine } from './engine';
import { guardRows } from './source';
import { VERSION_KEY, versionOfVisible } from './version';

/** SELECT com as colunas na ordem dos campos; reference traz o título; com escopo, o dono no fim. */
export function selectSql(ctx: Ctx, entity: Entity, from: string): string {
  const engine = ctx.engine;
  const cols = ['t."id"'];
  for (const f of entity.fields) {
    cols.push(f.writeOnly ? 'NULL' : `t."${f.name}"`);
    const sub = titleSql(ctx, f);
    if (sub) cols.push(sub);
  }
  const o = engine.app.organization;
  if (o) {
    const owner = (col: string, target: string) =>
      `t."${col}", (SELECT o."${titleName(engine.entities.get(target))}" FROM "${target}" o WHERE o."id" = t."${col}")`;
    if (entity.scope !== 'group') cols.push(owner(COMPANY_COL, o.company));
    if (entity.scope === 'branch') cols.push(owner(BRANCH_COL, o.branch));
  }
  return `SELECT ${cols.join(', ')} FROM ${from} t`;
}

/** Título do registro apontado. Fora do escopo de leitura do usuário vem NULL: o nome não vaza. */
export function titleSql(ctx: Ctx, f: Field): string | undefined {
  if (f.reference === undefined) return undefined;
  const target = ctx.engine.entities.get(f.reference)!;
  const title = titleFieldOf(target);
  if (!title) return undefined;
  const scope = ctx.readScope(target, 'r');
  return `(SELECT r."${title.name}" FROM "${target.name}" r WHERE r."id" = t."${f.name}"${scope ? ` AND ${scope}` : ''})`;
}

export function rowToJson(entity: Entity, row: Row): Rec {
  const out: Rec = { id: String(intAt(row, 0) ?? 0) };
  let i = 1;
  for (const f of entity.fields) {
    let v: unknown;
    if (f.type === 'reference') {
      const id = intAt(row, i);
      const title = textAt(row, i + 1);
      i += 1;
      v = id === null ? null : { id: String(id), title };
    } else if (f.type === 'file') v = fileToWire(textAt(row, i));
    else if (isIntColumn(f)) v = intToWire(f, intAt(row, i));
    else v = textAt(row, i);
    i += 1;
    out[f.name] = v;
  }
  const owners = entity.scope === 'group' ? [] : entity.scope === 'company' ? ['_company'] : ['_company', '_branch'];
  for (const key of owners) {
    out[key] = { id: String(intAt(row, i) ?? 0), title: textAt(row, i + 1) };
    i += 2;
  }
  return out;
}

/** Registros no formato trafegado; `filter` é o resto do SQL depois do WHERE (alias `t`). */
export async function fetchRows(conn: Conn, ctx: Ctx, entity: Entity, filter: string, params: SqlValue[]): Promise<Rec[]> {
  const sql = `${selectSql(ctx, entity, `"${entity.name}"`)} WHERE ${filter}`;
  return (await conn.query(sql, params)).map((r) => rowToJson(entity, r));
}

/** Um registro, dentro do escopo de leitura do usuário (fora dele, undefined: vira 404, não 403). */
export async function fetchOne(conn: Conn, ctx: Ctx, entity: Entity, id: number): Promise<Rec | undefined> {
  const scope = ctx.readScope(entity, 't');
  const rows = await fetchRows(conn, ctx, entity, `t."id" = ?${scope ? ` AND ${scope}` : ''}`, [id]);
  return rows[0];
}

/** `_can` de uma linha, sem o que o usuário não vê e com a `_version`: toda resposta com registro passa por aqui. */
export function attachCan(ctx: Ctx, entity: Entity, record: Rec): void {
  strip(ctx, entity, record);
  record[VERSION_KEY] = versionOfVisible(entity, record);
  if (entity.scope === 'group') return;
  const owner = ownerOf(record);
  const table = entity.source === undefined;
  const update = table && ctx.canWrite(entity, owner, (c) => c.update);
  const del = table && !entity.singleton && ctx.canWrite(entity, owner, (c) => c.delete);
  record._can = { update, delete: del };
}

/** Registro lido com as listas `with_parent` e o `_can`: a resposta de ler, criar e alterar. */
export async function fullRecord(conn: Conn, ctx: Ctx, entity: Entity, id: number): Promise<Rec> {
  const record = await fetchOne(conn, ctx, entity, id);
  if (!record) throw ApiError.notFound('Registro não encontrado.');
  await attachChildren(conn, ctx, entity, record);
  attachCan(ctx, entity, record);
  return record;
}

export function parsePathId(raw: string): number {
  const id = parseId(raw);
  if (id === undefined) throw ApiError.notFound('Registro não encontrado.');
  return id;
}

export async function read(engine: Engine, req: EngineRequest, name: string, id: string): Promise<Rec> {
  const entity = engine.entity(name);
  guardRows(entity);
  const ctx = await Ctx.of(engine, req);
  allowRead(ctx, entity, (c) => c.read);
  const rowId = parsePathId(id);
  return fullRecord(await engine.storeOf(entity).conn(), ctx, entity, rowId);
}

export const writable = (entity: Entity): Field[] => entity.fields.filter((f) => !f.readOnly);
