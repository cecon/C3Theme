// Criar e alterar: corpo, permissão, validação e gravação (pelo motor numa transação, ou pelo sistema).

import { type Entity, fieldOf } from '../domain/entity';
import { ApiError } from '../domain/errors';
import { BRANCH_COL, COMPANY_COL, type Rec, type SqlValue, isObject } from '../domain/types';
import type { Capabilities } from '../ports/hooks';
import type { EngineRequest } from '../ports/request';
import { type Conn, inTx } from '../ports/store';
import { checkWrite } from './access';
import { type Sent, guardDirectWrite, takeChildren } from './children';
import { applyChildren, toWrites } from './children-write';
import { Ctx, type Owner, allowRead, ownerOf, ownerOfNew } from './ctx';
import { runWrite } from './delegated';
import type { Engine } from './engine';
import { guardLocked } from './locked';
import { fetchOne, fullRecord, parsePathId, writable } from './read';
import { checkRecord } from './record-check';
import { guardSingleton } from './singleton';
import { guardRows } from './source';
import { guardWrites } from '../domain/store-spec';
import { mapWriteError, normalizeRefs } from './validation';
import { Expect, VERSION_KEY } from './version';
import { writeValues } from './write-values';

/** O corpo como objeto, sem as listas `with_parent`. id e `_version` são ignorados; `readOnly` só na criação. */
function parseBody(ctx: Ctx, entity: Entity, body: unknown, creating: boolean): [Rec, Sent] {
  if (!isObject(body)) throw ApiError.badRequest('Corpo precisa ser um objeto JSON.');
  const obj = { ...body };
  const kids = takeChildren(ctx, entity, obj, creating);
  if (creating) checkWrite(ctx, entity, undefined, obj);
  for (const key of Object.keys(obj))
    if (key !== 'id' && key !== VERSION_KEY && !fieldOf(entity, key)) throw ApiError.badRequest(`Campo desconhecido '${key}'.`);
  const out: Rec = {};
  for (const [k, v] of Object.entries(obj)) {
    const f = fieldOf(entity, k);
    if (f && (!creating || !f.readOnly)) out[k] = v;
  }
  return [out, kids];
}

/** O patch sem os campos `readOnly` (o mesmo valor do gravado já passou pelo `guardLocked`). */
function withoutReadOnly(entity: Entity, patch: Rec): Rec {
  return Object.fromEntries(Object.entries(patch).filter(([k]) => fieldOf(entity, k) && !fieldOf(entity, k)!.readOnly));
}

export async function create(engine: Engine, req: EngineRequest, name: string, body: unknown): Promise<Rec> {
  const entity = engine.entity(name);
  guardRows(entity);
  guardWrites(entity);
  const ctx = await Ctx.of(engine, req);
  // grava sempre na filial ativa; entidade com escopo sem ela não tem dono
  const active = ctx.active();
  if (entity.scope !== 'group' && !active) throw ApiError.badRequest('Escolha a filial ativa (cabeçalho C3-Branch) para criar.');
  const owner: Owner = active && entity.scope !== 'group' ? ownerOfNew(entity, active) : {};
  ctx.allowActive(name, (c) => c.create);
  guardDirectWrite(ctx, name);
  const [record, kids] = parseBody(ctx, entity, body, true);
  for (const f of writable(entity)) if (!(f.name in record)) record[f.name] = f.default ?? null;

  if (engine.hooks.delegatesWrites(name)) {
    normalizeRefs(entity, record);
    const conn = await engine.store.conn();
    await guardSingleton(conn, entity, owner);
    const [, plan] = await checkRecord(conn, ctx, entity, owner, record, undefined, kids);
    const children = toWrites(ctx, entity, plan);
    const id = await runWrite(ctx, entity, { op: 'create', owner, values: writeValues(entity, record), children });
    return fullRecord(await engine.store.conn(), ctx, entity, id);
  }

  return inTx(engine.store, async (tx) => {
    await guardSingleton(tx, entity, owner);
    const [values, plan] = await checkRecord(tx, ctx, entity, owner, record, undefined, kids);
    const cols = writable(entity).map((f) => `"${f.name}"`);
    for (const [col, id] of [
      [COMPANY_COL, owner.company],
      [BRANCH_COL, owner.branch]
    ] as const) {
      if (id === undefined) continue;
      cols.push(`"${col}"`);
      values.push(id);
    }
    const sql = cols.length
      ? `INSERT INTO "${entity.name}" (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
      : `INSERT INTO "${entity.name}" DEFAULT VALUES`;
    const done = await tx.execute(sql, values).catch((e: unknown) => {
      throw mapWriteError(e, entity);
    });
    await applyChildren(tx, ctx, entity, plan, done.lastInsertId, owner);
    return fullRecord(tx, ctx, entity, done.lastInsertId);
  });
}

/**
 * Carrega o registro dentro do escopo de leitura (fora: 404), confere a capability na filial dona (403) e a versão do
 * `If-Match` (412). Devolve o registro e o filtro de escopo para o próprio UPDATE/DELETE.
 */
export async function loadForWrite(
  conn: Conn,
  ctx: Ctx,
  entity: Entity,
  id: number,
  pick: (c: Capabilities) => boolean,
  expect: Expect
): Promise<[Rec, string]> {
  allowRead(ctx, entity, (c) => c.read || pick(c));
  const record = await fetchOne(conn, ctx, entity, id);
  if (!record) throw ApiError.notFound('Registro não encontrado.');
  if (!ctx.canWrite(entity, ownerOf(record), pick)) throw ApiError.forbidden();
  expect.check(ctx, entity, record);
  const scope = ctx.readScope(entity, `"${entity.name}"`);
  return [record, scope ? ` AND ${scope}` : ''];
}

export async function update(engine: Engine, req: EngineRequest, name: string, rawId: string, body: unknown): Promise<Rec> {
  const entity = engine.entity(name);
  guardRows(entity);
  guardWrites(entity);
  const ctx = await Ctx.of(engine, req);
  const id = parsePathId(rawId);
  const expect = Expect.from(req);
  expect.allowUndo(entity);
  guardDirectWrite(ctx, name);
  const [patch, kids] = parseBody(ctx, entity, body, false);
  const merge = (before: Rec): [Rec, Owner] => {
    const record = { ...before };
    normalizeRefs(entity, record);
    guardLocked(ctx, entity, record, patch);
    return [Object.assign(record, withoutReadOnly(entity, patch)), ownerOf(before)];
  };

  if (engine.hooks.delegatesWrites(name)) {
    const conn = await engine.store.conn();
    const [before] = await loadForWrite(conn, ctx, entity, id, (c) => c.update, expect);
    const [record, owner] = merge(before);
    const [, plan] = await checkRecord(conn, ctx, entity, owner, record, id, kids);
    const children = toWrites(ctx, entity, plan);
    await runWrite(ctx, entity, { op: 'update', id, before, owner, values: writeValues(entity, record), children });
    return fullRecord(await engine.store.conn(), ctx, entity, id);
  }

  // ler, validar e gravar na mesma transação: ninguém muda o registro no meio
  return inTx(engine.store, async (tx) => {
    const [before, scope] = await loadForWrite(tx, ctx, entity, id, (c) => c.update, expect);
    const [record, owner] = merge(before);
    const [values, plan] = await checkRecord(tx, ctx, entity, owner, record, id, kids);
    const sets = writable(entity).map((f) => `"${f.name}" = ?`);
    if (sets.length) {
      const params: SqlValue[] = [...values, id];
      const sql = `UPDATE "${entity.name}" SET ${sets.join(', ')} WHERE "id" = ?${scope}`;
      const done = await tx.execute(sql, params).catch((e: unknown) => {
        throw mapWriteError(e, entity);
      });
      if (done.rowsAffected === 0) throw ApiError.notFound('Registro não encontrado.');
    }
    await applyChildren(tx, ctx, entity, plan, id, owner);
    return fullRecord(tx, ctx, entity, id);
  });
}
