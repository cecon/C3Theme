// Ações do produto: reajuste com grade e valores iniciais, desconto com prévia, arquivo da balança (`returns: "file"`)
// e a cópia que a shell abre (`open`).

import {
  type ActionCall,
  type ActionOutcome,
  ApiError,
  type BulkActionCall,
  type ListActionCall,
  type PrefillCall,
  type Preview,
  type PreviewCall,
  type Rec
} from '@c3theme/engine-node';

import { type Db, brl, cents, decimal, exec, rows, tx } from './db';

/** Uma linha por produto ativo, no formato trafegado: reference `{ id, title }` e decimal como string. */
export async function pricesPrefill(db: Db, call: PrefillCall): Promise<Rec> {
  if (call.entity !== 'product' || call.action !== 'reprice') return {};
  const list = await rows(db, 'SELECT id, name, price FROM product WHERE active = 1 ORDER BY name LIMIT 200');
  const prices = list.map(([id, name, price]) => ({
    product: { id: String(id), title: name },
    price: decimal(Number(price)),
    // coluna que a grade não declara: o motor tira antes de responder
    cents: price
  }));
  return { prices };
}

/**
 * Prévia do reajuste: com o percentual, a grade se refaz com o preço de hoje mais o reajuste (`fill.prices`); o que
 * o usuário digitou numa linha do mesmo produto a shell mantém.
 */
export async function pricesPreview(db: Db, call: PreviewCall): Promise<Preview> {
  const percent = cents(call.input.percent);
  if (percent === undefined) return {};
  const list = await rows(db, 'SELECT id, name, price FROM product WHERE active = 1 ORDER BY name LIMIT 200');
  const prices = list.map(([id, name, price]) => {
    // percent em centésimos (12,5% = 1250): preço × (10000 + p) / 10000, arredondado
    const next = Math.max(0, Math.floor((Number(price) * (10_000 + percent) + 5_000) / 10_000));
    return { product: { id: String(id), title: name }, price: decimal(next), cents: next };
  });
  return { message: `${prices.length} produto(s) com o reajuste.`, fill: { prices } };
}

/** Grava os preços; o motor já validou cada linha. Aqui só o que é do negócio: o produto existir. */
export function applyPrices(db: Db, call: ListActionCall): Promise<ActionOutcome> {
  const lines = Array.isArray(call.input.prices) ? (call.input.prices as Rec[]) : [];
  return tx(db, async (t) => {
    for (const line of lines) {
      const id = Number(line.product);
      const c = cents(line.price);
      if (!Number.isInteger(id) || c === undefined) throw ApiError.internal();
      if ((await t.execute('UPDATE product SET price = ? WHERE id = ?', [c, id])).rowsAffected === 0)
        throw ApiError.conflict(`Produto ${id} não existe mais.`);
    }
    return { message: `${lines.length} preço(s) aplicado(s).` };
  });
}

/**
 * Etiquetas de preço (`product.labels`, grade `fromSelection`): uma linha por produto marcado, cada um com a sua
 * quantidade. O motor já conferiu que as linhas são a seleção; aqui só a soma.
 */
export function labels(call: BulkActionCall): ActionOutcome {
  const lines = Array.isArray(call.input.items) ? (call.input.items as Rec[]) : [];
  const total = lines.reduce((n, l) => n + Number(l.copies ?? 0), 0);
  return { message: `${total} etiqueta(s) de ${lines.length} produto(s) na fila da impressora.` };
}

/** TXT de carga da balança: `código;nome;preço` com o preço em centavos. */
export async function scaleFile(db: Db, call: ListActionCall): Promise<ActionOutcome> {
  const onlyActive = call.input.only_active !== false;
  const list = await rows(db, 'SELECT id, name, price FROM product WHERE active = 1 OR ? = 0 ORDER BY id', [onlyActive ? 1 : 0]);
  if (!list.length) return { message: 'Nenhum produto para a balança.' };
  const txt = list.map(([id, name, price]) => `${String(id).padStart(6, '0')};${String(name).replaceAll(';', ',')};${price}\r\n`).join('');
  return {
    file: { name: 'balança.txt', contentType: 'text/plain; charset=utf-8', data: new TextEncoder().encode(txt) },
    message: `${list.length} produto(s) no arquivo da balança.`
  };
}

/** Cópia inativa ("Cópia de …"); a shell abre a cópia. */
export async function duplicateProduct(db: Db, id: number): Promise<ActionOutcome> {
  const sql =
    "INSERT INTO product (name, product_group, price, active) SELECT substr('Cópia de ' || name, 1, 120), product_group, price, 0 " +
    'FROM product WHERE id = ?';
  const done = await exec(db, sql, [id]);
  return { message: 'Cópia criada.', open: { id: String(done.lastInsertId) } };
}

/** Preço atual, desconto e preço novo. Sem o percentual ainda, só o pedido. */
export function discountPreview(call: PreviewCall): Preview {
  const current = cents(call.record?.price);
  if (current === undefined) throw ApiError.internal();
  const percent = cents(call.input.percent);
  if (percent === undefined) return { message: 'Informe o desconto para ver o preço novo.' };
  // percent vem em centésimos (10.5% = 1050): preço × (10000 − p) / 10000, arredondado
  const next = Math.trunc((current * (10_000 - percent) + 5_000) / 10_000);
  const row = (item: string, value: string) => ({ item, value });
  return {
    message: `De ${brl(current)} para ${brl(next)}.`,
    fill: { price: decimal(next) },
    table: {
      columns: [
        { name: 'item', label: 'Item' },
        { name: 'value', label: 'Valor' }
      ],
      rows: [row('Preço atual', brl(current)), row('Desconto', brl(current - next)), row('Preço novo', brl(next))]
    }
  };
}

/** Grava o preço novo que o usuário confirmou (o da prévia ou outro que ele digitou). */
export async function applyDiscount(db: Db, call: ActionCall, id: number): Promise<ActionOutcome> {
  const price = cents(call.input.price);
  if (price === undefined) throw ApiError.internal();
  await exec(db, 'UPDATE product SET price = ? WHERE id = ?', [price, id]);
  return { message: `Preço novo: ${brl(price)}.` };
}
