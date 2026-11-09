// Os hooks do CRM de exemplo, os mesmos de crates/c3-example: usuários de teste (src/users.ts), regras do cardápio,
// escritores próprios do pedido e do operador e as ações de cada entidade.

import { ApiError, type Hooks } from '@c3theme/engine-node';

import { runAction } from './actions';
import { type Db, exec } from './db';
import { invoice, invoicePreview, lookup, readAttachment, source } from './extras';
import { validateMenu, validateMenuChildren } from './menu';
import { writeOperator } from './operators';
import { writeOrder } from './orders';
import { applyPrices, discountPreview, pricesPrefill, scaleFile } from './products';
import { actionAllowed, capabilities, orgAccess, permitted, user, userValue } from './users';

export function exampleHooks(db: Db): Hooks {
  return {
    orgAccess,
    capabilities,
    permitted,
    userValue,
    actionAllowed,
    validate: (_ctx, entity, record, conn, errors) => validateMenu(entity, record, conn, errors),
    validateChildren: (_ctx, entity, record, children, _conn, errors) => validateMenuChildren(entity, record, children, errors),
    // o pedido e os itens são gravados pelo sistema, com auditoria, e o operador também (faz o hash da senha)
    delegatesWrites: (entity) => entity === 'sales_order' || entity === 'operator',
    write: (call) => (call.entity === 'operator' ? writeOperator(db, call) : writeOrder(db, call, user(call.ctx.req))),
    runAction: (call) => runAction(db, call),
    async runListAction(call) {
      const key = `${call.entity}.${call.action}`;
      if (key === 'product.reprice') return applyPrices(db, call);
      if (key === 'product.scale_file') return scaleFile(db, call);
      if (key !== 'seller.apply_schedule') throw ApiError.internal();
      // aplica uma jornada a todos os vendedores do canal, na filial ativa (seller é por filial)
      const branch = call.ctx.activeBranch;
      if (branch === undefined) throw ApiError.badRequest('Escolha a filial ativa.');
      const days = typeof call.input.work_days === 'number' ? call.input.work_days : null;
      const channel = typeof call.input.channel === 'string' ? call.input.channel : null;
      const sql = 'UPDATE seller SET work_days = ? WHERE channel = ? AND org_branch_id = ?';
      const done = await exec(db, sql, [days, channel, Number(branch)]);
      return { message: `Jornada aplicada a ${done.rowsAffected} vendedor(es).` };
    },
    actionPrefill: (call) => pricesPrefill(db, call),
    async runBulkAction(call) {
      if (call.entity === 'sales_order' && call.action === 'invoice') return invoice(db, call);
      throw ApiError.internal();
    },
    async previewAction(call) {
      if (call.entity === 'product' && call.action === 'discount') return discountPreview(call);
      if (call.entity === 'sales_order' && call.action === 'invoice') return invoicePreview(call);
      return {};
    },
    lookup: async (call) => lookup(call),
    source: async (call) => source(call),
    readFile: async (call) => readAttachment(db, call)
  };
}
