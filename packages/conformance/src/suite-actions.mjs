// Ações de registro, uma a uma e em lote: regra do sistema, visibleWhen, input, permissão e escopo.

import assert from 'node:assert/strict';
import { assertError, assertFieldError } from './assertions.mjs';

export function actionTests({ test, call, newCustomer, as, newOrder }) {
  // ---------------- ações ----------------

  const act = (id, action, body) => call('POST', `/customer/${id}/_actions/${action}`, body);

  test('ações', 'ação roda a regra do sistema e devolve o registro depois dela', async () => {
    const c = await newCustomer({ name: 'Ação perder' });
    const res = await act(c.id, 'churn', { reason: 'price' });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.data.id, c.id);
    assert.equal(res.body.data.status, 'churned');
    assert.equal(res.body.data.churn_reason, 'Preço');
    assert.ok(res.body.message === undefined || res.body.message === null || typeof res.body.message === 'string');
    const back = await call('GET', `/customer/${c.id}`);
    assert.equal(back.body.data.status, 'churned');
  });

  test('ações', 'ação sem input aceita corpo vazio; message do sistema volta', async () => {
    const c = await newCustomer({ name: 'Ação reativar', status: 'churned', churn_reason: 'teste' });
    const res = await act(c.id, 'reactivate');
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.data.status, 'active');
    assert.equal(res.body.data.churn_reason, null);
    assert.equal(typeof res.body.message, 'string');
  });

  test('ações', 'visibleWhen falso para o registro → 409 conflict, nada muda', async () => {
    const lead = await newCustomer({ name: 'Ação indisponível' });
    assertError(await act(lead.id, 'reactivate'), 409, 'conflict');
    const lost = await newCustomer({ name: 'Ação já perdido', status: 'churned', churn_reason: 'antes' });
    assertError(await act(lost.id, 'churn', { reason: 'price' }), 409, 'conflict');
    assert.equal((await call('GET', `/customer/${lost.id}`)).body.data.churn_reason, 'antes');
  });

  test('ações', 'input validado com as regras e condições do próprio input → 422', async () => {
    const c = await newCustomer({ name: 'Ação input' });
    assertFieldError(await act(c.id, 'churn', {}), 'reason', 'required');
    assertFieldError(await act(c.id, 'churn', { reason: 'xyz' }), 'reason', 'invalid_option');
    assertFieldError(await act(c.id, 'churn', { reason: 'other' }), 'details', 'required');
    assertFieldError(await act(c.id, 'churn', { reason: 'other', details: 'curto' }), 'details', 'too_short');
    assert.equal((await call('GET', `/customer/${c.id}`)).body.data.status, 'lead', 'input inválido não pode rodar a ação');
    const ok = await act(c.id, 'churn', { reason: 'other', details: 'Fechou a loja em outubro.' });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    assert.equal(ok.body.data.churn_reason, 'Outro: Fechou a loja em outubro.');
  });

  test('ações', 'ação, registro ou corpo inválidos → 404 / 400', async () => {
    const c = await newCustomer({ name: 'Ação erros' });
    assertError(await act(c.id, 'nao_existe'), 404, 'not_found');
    assertError(await act('999999999', 'churn', { reason: 'price' }), 404, 'not_found');
    assertError(await act('abc', 'churn', { reason: 'price' }), 404, 'not_found');
    assertError(await act(c.id, 'churn', '{quebrado'), 400, 'bad_request');
    assertError(await act(c.id, 'churn', '[1]'), 400, 'bad_request');
    assertError(await act(c.id, 'churn', { reason: 'price', inventado: 1 }), 400, 'bad_request');
  });

  const cancel = (user, branch, id, reason) => as(user, branch).post(`/sales_order/${id}/_actions/cancel`, { reason });
  const REASON = 'Cliente desistiu antes da entrega.';

  test('ações', 'campo readOnly só muda pela ação; erro da regra do sistema volta por campo', async () => {
    const o = await newOrder(null, 1);
    assert.equal(o.status, 'open');
    await as(null, 1).patch(`/sales_order/${o.id}`, { status: 'canceled' });
    assert.equal((await as(null, 1).get(`/sales_order/${o.id}`)).body.data.status, 'open', 'PATCH não pode cancelar');
    assertFieldError(await cancel(null, 1, o.id, 'pedido de teste, cancelar'), 'reason', 'pattern');
    const res = await cancel(null, 1, o.id, REASON);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.data.status, 'canceled');
    assert.equal(res.body.data.cancel_reason, REASON);
    assertError(await cancel(null, 1, o.id, REASON), 409, 'conflict');
  });

  test('ações', 'permissão da ação na filial dona do registro; fora do escopo → 404', async () => {
    const o = await newOrder(null, 2);
    const meta = (await as('ana', 2).get('/_meta/entities/sales_order')).body.capabilities.actions;
    assert.deepEqual(meta, { cancel: false, invoice: false });
    assert.deepEqual((await as('ana', 1).get('/_meta/entities/sales_order')).body.capabilities.actions, { cancel: true, invoice: true });
    // ana lê o pedido do Centro, mas não cancela lá, nem com a Matriz ativa
    assertError(await cancel('ana', 2, o.id, REASON), 403, 'forbidden');
    assertError(await cancel('ana', 1, o.id, REASON), 403, 'forbidden');
    assertError(await cancel('beto', 3, o.id, REASON), 404, 'not_found');
    assert.equal((await as(null, 2).get(`/sales_order/${o.id}`)).body.data.status, 'open');
    const mine = await newOrder('ana', 1);
    assert.equal((await cancel('ana', 1, mine.id, REASON)).status, 200);
  });

  const bulkCancel = (user, branch, body) => as(user, branch).post('/sales_order/_actions/cancel', body);
  const MISSING = '999999999';

  test('ações', 'em lote: cada registro passa ou falha sozinho, na ordem de ids', async () => {
    const [a, b, c] = [await newOrder(null, 1), await newOrder(null, 1), await newOrder(null, 1)];
    assert.equal((await cancel(null, 1, b.id, REASON)).status, 200);
    const res = await bulkCancel(null, 1, { ids: [a.id, b.id, MISSING, c.id], input: { reason: REASON } });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    const { results, meta } = res.body;
    assert.deepEqual(
      results.map((r) => [r.id, r.ok, r.error?.code ?? null]),
      [
        [a.id, true, null],
        [b.id, false, 'conflict'],
        [MISSING, false, 'not_found'],
        [c.id, true, null]
      ]
    );
    assert.deepEqual(meta, { ok: 2, failed: 2 });
    for (const r of [results[0], results[3]]) {
      assert.equal(r.data.status, 'canceled');
      assert.equal(r.data.cancel_reason, REASON);
      assert.ok('message' in r, 'item ok sem message');
    }
    for (const r of [results[1], results[2]]) assert.ok(typeof r.error.message === 'string' && r.error.message.length > 0);
    // erro da regra do sistema também fica no item, com fields
    const d = await newOrder(null, 1);
    const bad = await bulkCancel(null, 1, { ids: [d.id], input: { reason: 'pedido de teste, cancelar' } });
    assert.equal(bad.status, 200, JSON.stringify(bad.body));
    assert.equal(bad.body.results[0].error.code, 'validation_failed');
    assert.ok(bad.body.results[0].error.fields?.reason?.length > 0, JSON.stringify(bad.body));
  });

  test('ações', 'em lote: permissão e escopo por registro', async () => {
    const mine = await newOrder('ana', 1);
    const center = await newOrder(null, 2);
    const theirs = await newOrder('beto', 3);
    const res = await bulkCancel('ana', 1, { ids: [mine.id, center.id, theirs.id], input: { reason: REASON } });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.deepEqual(
      res.body.results.map((r) => r.error?.code ?? 'ok'),
      ['ok', 'forbidden', 'not_found']
    );
    assert.equal((await as(null, 2).get(`/sales_order/${center.id}`)).body.data.status, 'open');
    assert.equal((await as(null, 3).get(`/sales_order/${theirs.id}`)).body.data.status, 'open');
  });

  test('ações', 'em lote: pedido inválido → 404 / 400 / 422 antes de tocar em qualquer registro', async () => {
    const o = await newOrder(null, 1);
    // churn não declara bulk
    assertError(await call('POST', '/customer/_actions/churn', { ids: ['1'] }), 404, 'not_found');
    assertError(await bulkCancel(null, 1, { ids: [o.id], input: { reason: REASON }, extra: 1 }), 400, 'bad_request');
    for (const ids of [[], [o.id, o.id], [Number(o.id)], o.id, Array.from({ length: 101 }, (_, i) => String(i + 1))])
      assertError(await bulkCancel(null, 1, { ids, input: { reason: REASON } }), 400, 'bad_request');
    assertError(await bulkCancel(null, 1, { ids: [o.id], input: { reason: REASON, nope: 1 } }), 400, 'bad_request');
    assertError(await bulkCancel(null, 1, 'não é json'), 400, 'bad_request');
    assertFieldError(await bulkCancel(null, 1, { ids: [o.id], input: { reason: 'curto' } }), 'reason', 'too_short');
    assertFieldError(await bulkCancel(null, 1, { ids: [o.id] }), 'reason', 'required');
    assert.equal((await as(null, 1).get(`/sales_order/${o.id}`)).body.data.status, 'open');
  });
}
