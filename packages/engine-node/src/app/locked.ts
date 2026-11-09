// Campo travado na alteração: `readOnly` (calculado pelo backend), `createOnly` e `readOnlyWhen` sobre o registro
// como está gravado. A shell manda o registro inteiro no PATCH, então o mesmo valor passa; só mudar é recusado.

import { evalCondition } from '../domain/condition';
import type { Entity } from '../domain/entity';
import { ApiError, FieldErrors } from '../domain/errors';
import type { Field } from '../domain/field';
import { type Rec, isObject } from '../domain/types';
import { isEmpty, toSql } from '../domain/value';
import { checkWrite } from './access';
import type { Ctx } from './ctx';

/** Confere `patch` contra o gravado `before` (reference já como id). Erros com o `prefix` da linha (`itens.2.`). */
export function checkLocked(entity: Entity, before: Rec, patch: Rec, prefix: string, errors: FieldErrors): void {
  for (const f of entity.fields) {
    const locked = f.readOnly || f.createOnly || (f.readOnlyWhen !== undefined && evalCondition(f.readOnlyWhen, before, entity));
    if (!locked || !(f.name in patch)) continue;
    const sent = patch[f.name];
    // senha vazia na alteração mantém a gravada (a leitura sempre traz null)
    if (!sameValue(f, sent, before[f.name]) && !(f.writeOnly && isEmpty(sent))) {
      const message = f.readOnly
        ? 'Este campo é preenchido pelo sistema e não se altera por aqui.'
        : 'Este campo não pode mais ser alterado.';
      errors.add(`${prefix}${f.name}`, 'read_only', message);
    }
  }
}

/** O valor enviado é o mesmo do gravado (vazio é igual a vazio; o resto compara como o banco grava)? */
export function sameValue(f: Field, sent: unknown, old: unknown): boolean {
  const id = (v: unknown) => (isObject(v) && f.type === 'reference' ? (v.id ?? null) : v);
  const [a, b] = [id(sent), id(old)];
  if (isEmpty(a) || isEmpty(b)) return isEmpty(a) && isEmpty(b);
  const [x, y] = [toSql(f, a), toSql(f, b)];
  return x.ok && y.ok && x.value === y.value;
}

/** `checkLocked` do pai, depois da permissão por campo: qualquer campo travado alterado já é 422. */
export function guardLocked(ctx: Ctx, entity: Entity, before: Rec, patch: Rec): void {
  checkWrite(ctx, entity, before, patch);
  const errors = new FieldErrors();
  checkLocked(entity, before, patch, '', errors);
  if (!errors.isEmpty()) throw ApiError.validation(errors);
}
