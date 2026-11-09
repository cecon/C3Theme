// Escritor próprio do pedido: o que um sistema com escrita delegada faz em `Hooks.write`. Grava o pedido, os itens
// (`with_parent`), o anexo e a auditoria na mesma transação e devolve os erros que só a gravação descobre.

import { ApiError, FieldErrors, type Rec, type SqlValue, StoreError, type Tx, type WriteCall } from '@c3theme/engine-node';

import { type Db, cents, tx } from './db';

const COLUMNS = ['number', 'description', 'customer_id', 'seller_id', 'total'];

/** Valor trafegado → coluna: reference e inteiro como número, decimal (scale 2) em centavos. */
function column(col: string, v: unknown): SqlValue {
  if (v === null || v === undefined) return null;
  if ((col === 'total' || col === 'unit_price') && typeof v === 'string') {
    const c = cents(v);
    if (c === undefined) throw ApiError.internal();
    return c;
  }
  if (typeof v === 'string' || typeof v === 'number') return v;
  return JSON.stringify(v);
}

/** O número do pedido é único por filial: a violação volta como erro do campo, igual ao CRUD do motor. */
function unique(e: unknown): unknown {
  if (e instanceof StoreError && e.kind === 'unique') {
    const fields = new FieldErrors();
    fields.add('number', 'unique', 'Já existe um registro com este valor.');
    return ApiError.conflict('Já existe um registro com estes dados.', fields);
  }
  return e;
}

interface Audit {
  entity: string;
  id: number;
  op: string;
  before?: Rec;
  after?: Rec;
}

const audit = (t: Tx, a: Audit, who: string | undefined) =>
  t.execute('INSERT INTO audit_log (entity, record_id, op, before, after, user_name) VALUES (?, ?, ?, ?, ?, ?)', [
    a.entity,
    a.id,
    a.op,
    a.before ? JSON.stringify(a.before) : null,
    a.after ? JSON.stringify(a.after) : null,
    who ?? null
  ]);

export function writeOrder(db: Db, call: WriteCall, who: string | undefined): Promise<number> {
  return tx(db, async (t) => {
    const values = COLUMNS.map((c) => column(c, call.values[c]));
    // itens antes do pedido no excluir; depois dele no criar (precisa do id novo)
    if (call.op === 'delete') await writeItems(t, call.id ?? 0, call, who);
    let id: number;
    if (call.op === 'create') {
      const sql =
        'INSERT INTO sales_order (number, description, customer_id, seller_id, total, org_company_id, org_branch_id) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?)';
      const done = await t.execute(sql, [...values, call.company ?? null, call.branch ?? null]).catch((e: unknown) => {
        throw unique(e);
      });
      id = done.lastInsertId;
    } else {
      id = call.id ?? 0;
      const [sql, params] =
        call.op === 'update'
          ? ['UPDATE sales_order SET number = ?, description = ?, customer_id = ?, seller_id = ?, total = ? WHERE id = ?', [...values, id]]
          : ['DELETE FROM sales_order WHERE id = ?', [id]];
      const done = await t.execute(sql, params).catch((e: unknown) => {
        throw unique(e);
      });
      if (done.rowsAffected === 0) throw ApiError.notFound('Registro não encontrado.');
    }
    if (call.op !== 'delete') {
      await saveAttachment(t, id, call.values);
      await writeItems(t, id, call, who);
    }
    const after = call.op === 'delete' ? undefined : call.values;
    await audit(t, { entity: 'sales_order', id, op: call.op, before: call.before, after }, who);
    return id;
  });
}

/** Itens do pedido: o motor manda excluir, alterar e incluir, nessa ordem. */
async function writeItems(t: Tx, orderId: number, call: WriteCall, who: string | undefined): Promise<void> {
  const rows = call.children.filter((c) => c.entity === 'sales_order_item').flatMap((s) => s.rows);
  for (const row of rows) {
    const v = (k: string) => column(k, row.values[k]);
    let id = row.id ?? 0;
    if (row.op === 'delete') await t.execute('DELETE FROM sales_order_item WHERE id = ? AND order_id = ?', [id, orderId]);
    else if (row.op === 'update') {
      const sql = 'UPDATE sales_order_item SET product = ?, quantity = ?, unit_price = ? WHERE id = ? AND order_id = ?';
      await t.execute(sql, [v('product'), v('quantity'), v('unit_price'), id, orderId]);
    } else {
      const sql =
        'INSERT INTO sales_order_item (order_id, product, quantity, unit_price, org_company_id, org_branch_id) VALUES (?, ?, ?, ?, ?, ?)';
      const done = await t.execute(sql, [orderId, v('product'), v('quantity'), v('unit_price'), call.company ?? null, call.branch ?? null]);
      id = done.lastInsertId;
    }
    const after = row.op === 'delete' ? undefined : row.values;
    await audit(t, { entity: 'sales_order_item', id, op: row.op, before: row.before, after }, who);
  }
}

/** Anexo: sem a chave, fica; `null` remove; com `data`, troca. Os bytes vão numa tabela à parte. */
async function saveAttachment(t: Tx, id: number, values: Rec): Promise<void> {
  if (!('attachment' in values)) return;
  const file = values.attachment as Rec | null;
  await t.execute('DELETE FROM sales_order_file WHERE order_id = ?', [id]);
  let meta: string | null = null;
  if (file) {
    const data = Buffer.from(String(file.data ?? ''), 'base64');
    // o Store só passa INTEGER e TEXT: o BLOB entra em hexadecimal e o próprio SQLite decodifica
    await t.execute('INSERT INTO sales_order_file (order_id, data) VALUES (?, unhex(?))', [id, data.toString('hex')]);
    meta = JSON.stringify({ name: file.name, size: data.length, contentType: file.contentType ?? null });
  }
  await t.execute('UPDATE sales_order SET attachment = ? WHERE id = ?', [meta, id]);
}
