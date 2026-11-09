// Escrita delegada ao sistema (`Hooks.delegatesWrites`): o motor valida e confere permissão e escopo como no CRUD; quem
// grava é o sistema, com o escritor e a auditoria dele. O motor não segura conexão nem transação durante a chamada.

import type { Entity } from '../domain/entity';
import type { Rec } from '../domain/types';
import type { ChildWrite, WriteOp } from '../ports/hooks';
import type { Ctx, Owner } from './ctx';

export interface Delegated {
  op: WriteOp;
  id?: number;
  before?: Rec;
  owner: Owner;
  values: Rec;
  children: ChildWrite[];
}

export function runWrite(ctx: Ctx, entity: Entity, w: Delegated): Promise<number> {
  return ctx.engine.hooks.write({
    entity: entity.name,
    op: w.op,
    id: w.id,
    before: w.before,
    values: w.values,
    company: w.owner.company,
    branch: w.owner.branch,
    children: w.children,
    ctx: ctx.requestContext(),
    store: ctx.engine.store
  });
}
