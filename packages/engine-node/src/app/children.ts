// Filhas `with_parent` na leitura e no corpo do pai: a lista vem inteira junto do registro; no POST/PATCH, sai do
// corpo para ser validada linha a linha (`children-write.ts`).

import type { Child } from '../domain/children-spec';
import type { Entity } from '../domain/entity';
import { ApiError } from '../domain/errors';
import { type Rec, isObject } from '../domain/types';
import type { Conn } from '../ports/store';
import { denied, forbiddenField } from './access';
import type { Ctx } from './ctx';
import { fetchRows } from './read';

/** Linhas filhas de um pai, no formato trafegado e na ordem da seção. */
export function childRows(conn: Conn, ctx: Ctx, child: Child, parentId: number): Promise<Rec[]> {
  return fetchRows(conn, ctx, child.entity, `t."${child.fk}" = ? ORDER BY ${child.order}`, [parentId]);
}

/** Põe no registro lido do pai a lista de cada seção `with_parent`. */
export async function attachChildren(conn: Conn, ctx: Ctx, parent: Entity, record: Rec): Promise<void> {
  const id = typeof record.id === 'string' ? Number(record.id) : NaN;
  if (!Number.isInteger(id)) return;
  for (const child of ctx.engine.children.of(parent.name)) record[child.key] = await childRows(conn, ctx, child, id);
}

/** CRUD direto numa filha `with_parent` contornaria a gravação do pai. */
export function guardDirectWrite(ctx: Ctx, entity: string): void {
  if (ctx.engine.children.parentOf(entity) !== undefined) throw ApiError.forbidden();
}

/** Listas enviadas no corpo do pai, por seção (índice em `children.of`). */
export type Sent = [number, Rec[]][];

/** Tira do corpo as listas `with_parent`. Ausente na criação é lista vazia; ausente na alteração, não mudam. */
export function takeChildren(ctx: Ctx, parent: Entity, body: Rec, creating: boolean): Sent {
  const out: Sent = [];
  const d = denied(ctx, parent);
  ctx.engine.children.of(parent.name).forEach((child, i) => {
    let v: unknown;
    if (child.key in body) {
      if (d.hidden.has(child.key) || d.readOnly.has(child.key)) throw forbiddenField(child.key);
      v = body[child.key];
      delete body[child.key];
    } else if (creating) v = [];
    else return;
    const bad = () => ApiError.badRequest(`'${child.key}' precisa ser uma lista de objetos.`);
    if (!Array.isArray(v) || !v.every(isObject)) throw bad();
    out.push([i, v]);
  });
  return out;
}
