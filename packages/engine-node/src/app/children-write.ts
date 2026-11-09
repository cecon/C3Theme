// Validação e gravação das listas `with_parent`. A lista enviada substitui a gravada: linha com `id` altera, sem `id`
// inclui, linha gravada que não veio é excluída. Ordem: excluir, alterar, incluir (libera `unique` para quem entra).

import type { Child } from '../domain/children-spec';
import { evalCondition } from '../domain/condition';
import { type Entity, fieldOf } from '../domain/entity';
import { ApiError, FieldErrors } from '../domain/errors';
import { BRANCH_COL, COMPANY_COL, type Rec, type SqlValue } from '../domain/types';
import { parseId } from '../domain/value';
import type { ChildRow, ChildWrite } from '../ports/hooks';
import type { Conn } from '../ports/store';
import { type Sent, childRows } from './children';
import type { Ctx, Owner } from './ctx';
import { checkLocked } from './locked';
import { writable } from './read';
import { checkFields, mapWriteError, normalizeRefs } from './validation';
import { writeValues } from './write-values';

/** Uma linha validada: o que o sistema recebe e as colunas graváveis na ordem de `writable()`. */
interface Planned {
  row: ChildRow;
  sql: SqlValue[];
}

/** Linhas de cada seção enviada (índice em `children.of`). */
export type Plan = [number, Planned[]][];

const hiddenChild = (c: Child, parent: Entity, record: Rec) => c.visibleWhen !== undefined && !evalCondition(c.visibleWhen, record, parent);

/**
 * Valida as listas enviadas. Erro de formato (chave desconhecida, id repetido) é 400; erro de valor vai para
 * `errors` com o prefixo da linha. Seção escondida pelo `visibleWhen` vale como lista vazia.
 */
export async function planChildren(
  conn: Conn,
  ctx: Ctx,
  parent: Entity,
  record: Rec,
  owner: Owner,
  parentId: number | undefined,
  payload: Sent,
  errors: FieldErrors
): Promise<Plan> {
  const children = ctx.engine.children.of(parent.name);
  children.forEach((c, ci) => {
    if (!hiddenChild(c, parent, record)) return;
    payload = payload.filter(([i]) => i !== ci);
    if (parentId !== undefined) payload.push([ci, []]);
  });
  const plan: Plan = [];
  for (const [ci, sent] of payload) {
    const child = children[ci];
    const current = parentId !== undefined ? await childRows(conn, ctx, child, parentId) : [];
    if (sent.length > child.max) errors.add(child.key, 'too_many', `Use no máximo ${child.max} linhas.`);
    else if (sent.length < child.min && !hiddenChild(child, parent, record))
      errors.add(child.key, 'too_few', `Informe pelo menos ${child.min} linha(s).`);
    const seen = new Set<number>();
    const kept: Planned[] = [];
    const created: Planned[] = [];
    const options = new Set<string>();
    for (const [i, row] of sent.entries()) {
      const prefix = `${child.key}.${i}.`;
      const id = rowId(child, row, prefix);
      if (id !== undefined) {
        if (seen.has(id)) throw ApiError.badRequest(`'${prefix}id' repetido na lista.`);
        seen.add(id);
      }
      const before = id !== undefined ? current.find((r) => r.id === String(id)) : undefined;
      if (id !== undefined && !before) {
        errors.add(`${prefix}id`, 'not_found', 'Esta linha não existe mais: outra pessoa pode tê-la removido.');
        continue;
      }
      const rec: Rec = before ? { ...before } : Object.fromEntries(writable(child.entity).map((f) => [f.name, f.default ?? null]));
      normalizeRefs(child.entity, rec);
      const errs = new FieldErrors();
      if (id !== undefined) checkLocked(child.entity, rec, row, '', errs);
      for (const [k, v] of Object.entries(row)) if (fieldOf(child.entity, k) && !fieldOf(child.entity, k)!.readOnly) rec[k] = v;
      const sql = await checkFields(conn, ctx, child.entity, owner, rec, id !== undefined, errs);
      if (errs.isEmpty()) await ctx.engine.hooks.validate(ctx.requestContext(), child.key, rec, conn, errs);
      const opt = child.option !== undefined ? rec[child.option] : undefined;
      if (opt !== undefined && opt !== null) {
        const k = JSON.stringify(opt);
        if (options.has(k)) errs.add(child.option!, 'duplicate', 'Esta opção já está marcada.');
        options.add(k);
      }
      errors.absorb(prefix, errs);
      const planned: Planned = {
        row: { op: id !== undefined ? 'update' : 'create', id, index: i, before, values: writeValues(child.entity, rec) },
        sql
      };
      (id !== undefined ? kept : created).push(planned);
    }
    const removed = current.filter((r) => !seen.has(parseId(String(r.id)) ?? -1)).map(deletion);
    plan.push([ci, [...removed, ...kept, ...created]]);
  }
  return plan;
}

function rowId(child: Child, row: Rec, prefix: string): number | undefined {
  const unknown = Object.keys(row).find((k) => k !== 'id' && !fieldOf(child.entity, k));
  if (unknown !== undefined) throw ApiError.badRequest(`Campo desconhecido '${prefix}${unknown}'.`);
  const v = row.id;
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') throw ApiError.badRequest(`'${prefix}id' precisa ser string.`);
  const id = parseId(v);
  if (id === undefined) throw ApiError.badRequest(`'${prefix}id' inválido.`);
  return id;
}

const deletion = (before: Rec): Planned => ({
  row: { op: 'delete', id: parseId(String(before.id)), before, values: {} },
  sql: []
});

/** Excluir o pai leva os filhos junto: todas as linhas viram exclusão. */
export async function planDeleteAll(conn: Conn, ctx: Ctx, parent: Entity, parentId: number): Promise<Plan> {
  const plan: Plan = [];
  for (const [ci, child] of ctx.engine.children.of(parent.name).entries())
    plan.push([ci, (await childRows(conn, ctx, child, parentId)).map(deletion)]);
  return plan;
}

/** As listas como vão ficar: para `Hooks.validateChildren` e para o `write` do sistema. */
export function toWrites(ctx: Ctx, parent: Entity, plan: Plan): ChildWrite[] {
  const children = ctx.engine.children.of(parent.name);
  return plan.map(([ci, list]) => ({ entity: children[ci].key, field: children[ci].fk, rows: list.map((p) => p.row) }));
}

/** Grava as linhas na transação do pai (escrita pelo motor). */
export async function applyChildren(conn: Conn, ctx: Ctx, parent: Entity, plan: Plan, parentId: number, owner: Owner): Promise<void> {
  const children = ctx.engine.children.of(parent.name);
  for (const [ci, list] of plan) for (const p of list) await applyRow(conn, children[ci], p, parentId, owner);
}

async function applyRow(conn: Conn, child: Child, p: Planned, parentId: number, owner: Owner): Promise<void> {
  const [table, fk] = [child.key, child.fk];
  const cols = writable(child.entity).map((f) => `"${f.name}"`);
  const params = [...p.sql];
  let sql: string;
  if (p.row.op === 'delete') sql = `DELETE FROM "${table}" WHERE "id" = ? AND "${fk}" = ?`;
  else if (p.row.op === 'update') {
    if (!cols.length) return;
    sql = `UPDATE "${table}" SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE "id" = ? AND "${fk}" = ?`;
  } else {
    cols.push(`"${fk}"`);
    params.push(parentId);
    for (const [col, id] of [
      [COMPANY_COL, owner.company],
      [BRANCH_COL, owner.branch]
    ] as const) {
      if (id === undefined) continue;
      cols.push(`"${col}"`);
      params.push(id);
    }
    sql = `INSERT INTO "${table}" (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
  }
  if (p.row.op !== 'create') params.push(p.row.id ?? 0, parentId);
  try {
    await conn.execute(sql, params);
  } catch (e) {
    const err = mapWriteError(e, child.entity);
    if (err instanceof ApiError && err.fields) {
      // a coluna do pai entra no índice único, mas não é da linha
      err.fields.remove(fk);
      const prefixed = new FieldErrors();
      prefixed.absorb(p.row.index !== undefined ? `${table}.${p.row.index}.` : `${table}.`, err.fields);
      err.fields = prefixed;
    } else if (err instanceof ApiError && p.row.op === 'delete') {
      throw new ApiError(err.status, err.code, 'Uma das linhas removidas está em uso por outros registros.');
    }
    throw err;
  }
}
