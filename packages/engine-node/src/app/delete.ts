// Excluir: o registro e as filhas gravadas com ele.

import { ApiError } from '../domain/errors';
import type { EngineRequest } from '../ports/request';
import { inTx } from '../ports/store';
import { guardDirectWrite } from './children';
import { applyChildren, planDeleteAll, toWrites } from './children-write';
import { Ctx, ownerOf } from './ctx';
import { runWrite } from './delegated';
import type { Engine } from './engine';
import { parsePathId } from './read';
import { guardRows } from './source';
import { mapWriteError } from './validation';
import { Expect } from './version';
import { loadForWrite } from './write';

export async function remove(engine: Engine, req: EngineRequest, name: string, rawId: string): Promise<void> {
  const entity = engine.entity(name);
  guardRows(entity);
  if (entity.singleton) throw ApiError.methodNotAllowed('Configuração de registro único não se exclui: altere os valores.');
  const ctx = await Ctx.of(engine, req);
  const id = parsePathId(rawId);
  const expect = Expect.from(req);
  expect.allowUndo(entity);
  guardDirectWrite(ctx, name);
  if (engine.hooks.delegatesWrites(name)) {
    const conn = await engine.store.conn();
    const [before] = await loadForWrite(conn, ctx, entity, id, (c) => c.delete, expect);
    const children = toWrites(ctx, entity, await planDeleteAll(conn, ctx, entity, id));
    await runWrite(ctx, entity, { op: 'delete', id, before, owner: ownerOf(before), values: {}, children });
    return;
  }
  await inTx(engine.store, async (tx) => {
    const [before, scope] = await loadForWrite(tx, ctx, entity, id, (c) => c.delete, expect);
    const plan = await planDeleteAll(tx, ctx, entity, id);
    await applyChildren(tx, ctx, entity, plan, id, ownerOf(before));
    const done = await tx.execute(`DELETE FROM "${entity.name}" WHERE "id" = ?${scope}`, [id]).catch((e: unknown) => {
      const err = mapWriteError(e, entity);
      throw err instanceof ApiError && err.code === 'conflict' ? ApiError.conflict('Este registro está em uso por outros registros.') : err;
    });
    if (done.rowsAffected === 0) throw ApiError.notFound('Registro não encontrado.');
  });
}
