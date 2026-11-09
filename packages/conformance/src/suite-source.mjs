// Consulta do sistema (spec/README.md): customer_pending vem do Hooks::source do c3-example, com o parâmetro `until`
// (default: hoje) e `stage` opcional. Lista, _aggregate e filtros seguem iguais; gravar e abrir linha são 405.

import assert from 'node:assert/strict';

export function sourceTests({ test, call, tag }) {
  const get = (params) => call('GET', `/customer_pending?${new URLSearchParams(params)}`);

  test('consulta do sistema', 'parâmetros na URL mudam as linhas; where, totais e defaults valem', async () => {
    const created = await call('POST', '/customer', { status: 'lead', name: `Consulta ${tag}` });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const customer = created.body.data.id;
    for (const [due_date, stage] of [
      ['2020-01-10', 'todo'],
      ['2020-02-10', 'doing'],
      ['2020-03-10', 'todo'],
      ['2020-04-10', 'done']
    ]) {
      const res = await call('POST', '/activity', { subject: `Consulta ${tag}`, stage, due_date, customer_id: customer });
      assert.equal(res.status, 201, JSON.stringify(res.body));
    }
    const mine = JSON.stringify({ field: 'customer_id', op: 'eq', value: customer });
    const feb = await get({ 'p.until': '2020-02-15', where: mine });
    assert.equal(feb.status, 200, JSON.stringify(feb.body));
    assert.equal(feb.body.data.length, 1);
    assert.equal(feb.body.data[0].open_count, 2);
    assert.equal(feb.body.data[0].oldest_due, '2020-01-10');
    assert.equal(feb.body.data[0]._can?.update ?? false, false);
    const todo = await get({ 'p.until': '2020-12-31', 'p.stage': 'todo', where: mine });
    assert.equal(todo.body.data[0].open_count, 2);
    // sem until na URL vale o default (hoje): as três em aberto, todas atrasadas
    const today = await get({ where: mine });
    assert.deepEqual([today.body.data[0].open_count, today.body.data[0].late_count], [3, 3]);
    const agg = await call(
      'GET',
      `/customer_pending/_aggregate?${new URLSearchParams({ measure: 'sum:open_count,sum:late_count', 'p.until': '2020-02-15', where: mine })}`
    );
    assert.deepEqual(agg.body.data, [{ key: null, value: 2, values: [2, 2] }]);
  });

  test('consulta do sistema', 'parâmetro inválido é 400/422; gravar e abrir linha são 405; meta traz os defaults', async () => {
    assert.equal((await get({ 'p.until': 'ontem' })).status, 422);
    assert.equal((await get({ 'p.until': '' })).status, 422, 'until é obrigatório');
    assert.equal((await get({ 'p.until': '2020-01-01', 'p.stage': 'done' })).status, 422, 'fora das opções');
    assert.equal((await get({ 'p.nada': '1' })).status, 400);
    assert.equal((await call('POST', '/customer_pending', {})).status, 405);
    assert.equal((await call('GET', '/customer_pending/1')).status, 405);
    assert.equal((await call('PATCH', '/customer_pending/1', {})).status, 405);
    assert.equal((await call('DELETE', '/customer_pending/1')).status, 405);
    const meta = await call('GET', '/_meta/entities/customer_pending');
    assert.equal(meta.status, 200);
    assert.deepEqual(meta.body.paramDefaults, { until: new Date().toISOString().slice(0, 10) });
    assert.deepEqual([meta.body.capabilities.create, meta.body.capabilities.update, meta.body.capabilities.delete], [false, false, false]);
  });
}
