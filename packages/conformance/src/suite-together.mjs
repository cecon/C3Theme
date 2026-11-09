// Ação em conjunto (spec/README.md, "Ação em conjunto"): sales_order.invoice tem `bulk: "together"`. O sistema roda
// uma vez sobre todos os ids (uma fatura com a soma), tudo ou nada; qualquer registro barrado recusa o pedido
// inteiro, com o erro de cada um em `records`.

import assert from 'node:assert/strict';
import { assertError, assertFieldError } from './assertions.mjs';

const DUE = '2026-12-10';

export function togetherTests({ test, as, newOrder }) {
  const invoice = (user, branch, body) => as(user, branch).post('/sales_order/_actions/invoice', body);
  const get = async (id) => (await as(null, 1).get(`/sales_order/${id}`)).body.data;

  test('ações', 'em conjunto: uma execução sobre todos, resposta { message } sem results', async () => {
    const [a, b] = [await newOrder(null, 1, { total: '10.50' }), await newOrder(null, 1, { total: '4.25' })];
    const res = await invoice(null, 1, { ids: [a.id, b.id], input: { due_date: DUE } });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.results, undefined, 'em conjunto não há resultado por registro');
    assert.match(res.body.message, /^Fatura \d+: 2 pedidos, R\$ 14,75\.$/);
    const [x, y] = [await get(a.id), await get(b.id)];
    assert.ok(x.invoice !== null && x.invoice === y.invoice, 'os dois na mesma fatura');
    // fora do visibleWhen agora: recusa de um id só volta como o erro dele
    assertError(await invoice(null, 1, { ids: [a.id], input: { due_date: DUE } }), 409, 'conflict');
  });

  test('ações', 'em conjunto: um barrado recusa todos (409 refused com records), nada roda', async () => {
    const ok = await newOrder(null, 1, { total: '1.00' });
    const done = await newOrder(null, 1, { total: '2.00' });
    assert.equal((await invoice(null, 1, { ids: [done.id], input: { due_date: DUE } })).status, 200);
    const MISSING = '999999999';
    const res = await invoice(null, 1, { ids: [ok.id, done.id, MISSING], input: { due_date: DUE } });
    assertError(res, 409, 'refused');
    assert.deepEqual(
      res.body.error.records.map((r) => [r.id, r.error.code]),
      [
        [done.id, 'conflict'],
        [MISSING, 'not_found']
      ]
    );
    assert.equal((await get(ok.id)).invoice, null, 'o liberado também não rodou');
  });

  test('ações', 'em conjunto: permissão e escopo por registro, antes de rodar', async () => {
    const mine = await newOrder('ana', 1);
    const center = await newOrder(null, 2);
    const res = await invoice('ana', 1, { ids: [mine.id, center.id], input: { due_date: DUE } });
    assertError(res, 409, 'refused');
    assert.deepEqual(
      res.body.error.records.map((r) => r.error.code),
      ['forbidden']
    );
    assert.equal((await get(mine.id)).invoice, null);
  });

  test('ações', 'em conjunto: input inválido → 422 uma vez, não por registro', async () => {
    const o = await newOrder(null, 1);
    assertFieldError(await invoice(null, 1, { ids: [o.id], input: {} }), 'due_date', 'required');
    assertFieldError(await invoice(null, 1, { ids: [o.id, (await newOrder(null, 1)).id], input: {} }), 'due_date', 'required');
    assertError(await invoice(null, 1, { ids: [], input: { due_date: DUE } }), 400, 'bad_request');
  });

  test('ações', 'em conjunto: no detalhe do registro roda com um id e relê o registro', async () => {
    const o = await newOrder(null, 1, { total: '3.00' });
    const res = await as(null, 1).post(`/sales_order/${o.id}/_actions/invoice`, { due_date: DUE });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.ok(res.body.data.invoice !== null);
    assert.match(res.body.message, /1 pedido, R\$ 3,00/);
  });

  test('ações', 'em conjunto: prévia sobre a seleção com { ids, input }; nada gravado', async () => {
    const [a, b] = [await newOrder(null, 1), await newOrder(null, 1)];
    const preview = (body) => as(null, 1).post('/sales_order/_actions/invoice/_preview', body);
    const res = await preview({ ids: [a.id, b.id], input: {} });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.message, 'Uma fatura com 2 pedidos. Informe o vencimento.');
    const dated = await preview({ ids: [a.id], input: { due_date: DUE } });
    assert.equal(dated.body.message, `Uma fatura com 1 pedido, vencimento em ${DUE}.`);
    assertError(await preview({ ids: [a.id, '999999999'], input: {} }), 409, 'refused');
    // ação em lote um por um não tem prévia sobre a seleção
    assertError(await as(null, 1).post('/sales_order/_actions/cancel/_preview', { ids: [a.id], input: {} }), 404, 'not_found');
    assert.equal((await get(a.id)).invoice, null);
  });
}
