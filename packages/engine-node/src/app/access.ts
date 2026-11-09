// Permissão por campo e seção (`access`): campo sem `view` some da leitura, lista, busca, filtro e ordem; sem `edit`
// é só leitura. Mudar campo (ou lista `with_parent`) sem permissão é 422 `forbidden`.

import type { Access } from '../domain/access';
import { type Entity, fieldOf } from '../domain/entity';
import { ApiError, FieldErrors } from '../domain/errors';
import type { Rec } from '../domain/types';
import type { Ctx } from './ctx';
import { sameValue } from './locked';

export interface Denied {
  hidden: Set<string>;
  readOnly: Set<string>;
}

export function denied(ctx: Ctx, entity: Entity): Denied {
  const out: Denied = { hidden: new Set(), readOnly: new Set() };
  const items: [string, Access][] = [
    ...entity.fields.map((f): [string, Access] => [f.name, f.access]),
    ...ctx.engine.children.of(entity.name).map((c): [string, Access] => [c.key, c.access])
  ];
  for (const [name, access] of items) {
    if (!access.view.every((c) => ctx.permitted(c))) out.hidden.add(name);
    else if (!access.edit.every((c) => ctx.permitted(c))) out.readOnly.add(name);
  }
  return out;
}

/** `capabilities.fields` de `/_meta`: `{ "custo": "hidden", "markup": "readOnly" }`. */
export function accessMeta(ctx: Ctx, entity: Entity): Rec {
  const d = denied(ctx, entity);
  const m: Rec = {};
  for (const n of d.hidden) m[n] = 'hidden';
  for (const n of d.readOnly) m[n] = 'readOnly';
  return m;
}

/** A entidade como o usuário a enxerga: sem os campos que ele não vê. */
export function viewOf(ctx: Ctx, entity: Entity): Entity {
  const { hidden } = denied(ctx, entity);
  if (!entity.fields.some((f) => hidden.has(f.name))) return entity;
  return {
    ...entity,
    fields: entity.fields.filter((f) => !hidden.has(f.name)),
    search: entity.search.filter((f) => !hidden.has(f))
  };
}

/** Tira do registro lido o que o usuário não vê. */
export function strip(ctx: Ctx, entity: Entity, record: Rec): void {
  const free =
    entity.fields.every((f) => f.access.view.length === 0) && ctx.engine.children.of(entity.name).every((c) => c.access.view.length === 0);
  if (free) return;
  for (const name of denied(ctx, entity).hidden) delete record[name];
}

const FORBIDDEN = 'Você não tem permissão para alterar este campo.';

/** O corpo não muda campo que o usuário não pode alterar (em relação ao gravado, ou ao padrão na criação). */
export function checkWrite(ctx: Ctx, entity: Entity, before: Rec | undefined, patch: Rec): void {
  const d = denied(ctx, entity);
  const errors = new FieldErrors();
  for (const [name, sent] of Object.entries(patch)) {
    if (!d.hidden.has(name) && !d.readOnly.has(name)) continue;
    const f = fieldOf(entity, name);
    if (!f) continue;
    const base = before ? before[name] : f.default;
    if (!sameValue(f, sent, base)) errors.add(name, 'forbidden', FORBIDDEN);
  }
  if (!errors.isEmpty()) throw ApiError.validation(errors);
}

export function forbiddenField(name: string): ApiError {
  const errors = new FieldErrors();
  errors.add(name, 'forbidden', FORBIDDEN);
  return ApiError.validation(errors);
}
