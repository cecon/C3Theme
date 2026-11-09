// Agregação para painéis (spec/README.md#painel): GET /{entity}/_aggregate conta ou soma, agrupando por enum,
// boolean, reference ou data, com o mesmo filtro da lista. Usa activity, sales_order e company.

import assert from 'node:assert/strict';

const agg = (api, entity, params) => api.get(`/${entity}/_aggregate?${new URLSearchParams(params)}`);

export function aggregateTests({ test, as, call, tag, newOrder }) {
  const api = as(null, 1);
  const subject = `Painel ${tag}`;
  const mineActivity = JSON.stringify({ field: 'subject', op: 'eq', value: subject });

  test('painel', 'contagem agrupada por enum, maiores primeiro, com o where da lista', async () => {
    for (const [stage, due_date] of [
      ['todo', '2026-09-30'],
      ['todo', '2026-10-01'],
      ['doing', '2026-10-15'],
      ['done', '2027-01-03']
    ]) {
      const res = await api.post('/activity', { subject, stage, due_date });
      assert.equal(res.status, 201, JSON.stringify(res.body));
    }
    const res = await agg(api, 'activity', { groupBy: 'stage', where: mineActivity });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.deepEqual(res.body.data, [
      { key: 'todo', value: 2 },
      { key: 'doing', value: 1 },
      { key: 'done', value: 1 }
    ]);
    const total = await agg(api, 'activity', { where: mineActivity });
    assert.deepEqual(total.body.data, [{ key: null, value: 4 }]);
  });

  test('painel', 'data agrupa por mês (padrão), dia ou ano, em ordem de tempo', async () => {
    const month = await agg(api, 'activity', { groupBy: 'due_date', where: mineActivity });
    assert.equal(month.status, 200, JSON.stringify(month.body));
    assert.deepEqual(month.body.data, [
      { key: '2026-09', value: 1 },
      { key: '2026-10', value: 2 },
      { key: '2027-01', value: 1 }
    ]);
    const day = await agg(api, 'activity', { groupBy: 'due_date', interval: 'day', where: mineActivity });
    assert.deepEqual(
      day.body.data.map((g) => g.key),
      ['2026-09-30', '2026-10-01', '2026-10-15', '2027-01-03']
    );
    const year = await agg(api, 'activity', { groupBy: 'due_date', interval: 'year', where: mineActivity });
    assert.deepEqual(year.body.data, [
      { key: '2026', value: 3 },
      { key: '2027', value: 1 }
    ]);
  });

  test(
    'painel',
    'soma de decimal vem como o campo (string escalada); reference traz o título do grupo e vazio vem por último',
    async () => {
      const seller = await api.post('/seller', { name: `Vendedor painel ${tag}` });
      assert.equal(seller.status, 201, JSON.stringify(seller.body));
      const description = `Painel ${tag}`;
      await newOrder(null, 1, { description, total: '10.50', seller_id: seller.body.data.id });
      await newOrder(null, 1, { description, total: '2.25', seller_id: seller.body.data.id });
      await newOrder(null, 1, { description, total: '1.00' });
      const where = JSON.stringify({ field: 'description', op: 'eq', value: description });
      const sum = await agg(api, 'sales_order', { measure: 'sum:total', groupBy: 'seller_id', where });
      assert.equal(sum.status, 200, JSON.stringify(sum.body));
      assert.deepEqual(sum.body.data, [
        { key: seller.body.data.id, title: `Vendedor painel ${tag}`, value: '12.75' },
        { key: null, title: null, value: '1.00' }
      ]);
      const none = await agg(api, 'sales_order', {
        measure: 'sum:total',
        where: JSON.stringify({ field: 'description', op: 'eq', value: `nada ${tag}` })
      });
      assert.deepEqual(none.body.data, [{ key: null, value: '0.00' }]);
      // totais da lista: várias medidas numa chamada, `value` é a primeira e `values` traz todas na ordem
      const totals = await agg(api, 'sales_order', { measure: 'sum:total,count', where });
      assert.equal(totals.status, 200, JSON.stringify(totals.body));
      assert.deepEqual(totals.body.data, [{ key: null, value: '13.75', values: ['13.75', 3] }]);
      const grouped = await agg(api, 'sales_order', { measure: 'count,sum:total', groupBy: 'seller_id', where });
      assert.deepEqual(
        grouped.body.data.map((g) => g.values),
        [
          [2, '12.75'],
          [1, '1.00']
        ]
      );
      const many = Array.from({ length: 11 }, () => 'count').join(',');
      assert.equal((await agg(api, 'sales_order', { measure: many })).status, 400, 'no máximo 10 medidas');
    }
  );

  test('painel', 'escopo e permissão: rowAccess vale, campo oculto não soma e pedido inválido é 400', async () => {
    for (const is_supplier of [true, false]) {
      const res = await call('POST', '/company', { trade_name: `Painel ${tag}`, is_supplier, supplier_terms: is_supplier ? 30 : null });
      assert.equal(res.status, 201, JSON.stringify(res.body));
    }
    const where = JSON.stringify({ field: 'trade_name', op: 'eq', value: `Painel ${tag}` });
    const all = await agg(as(null), 'company', { groupBy: 'is_supplier', where });
    assert.equal(all.status, 200, JSON.stringify(all.body));
    assert.equal(all.body.data.length, 2);
    const caio = await agg(as('caio'), 'company', { groupBy: 'is_supplier', where });
    assert.deepEqual(caio.body.data, [{ key: false, value: 1 }], 'caio não vê fornecedor');
    assert.equal((await agg(as('caio'), 'company', { measure: 'sum:supplier_terms' })).status, 400);
    assert.equal((await agg(as(null), 'company', { measure: 'sum:supplier_terms', where })).body.data[0].value, 30);
    for (const bad of [
      { measure: 'avg' },
      { measure: 'count,' },
      { groupBy: 'subject' },
      { groupBy: 'stage', interval: 'month' },
      { where: '{' }
    ]) {
      assert.equal((await agg(api, 'activity', bad)).status, 400, JSON.stringify(bad));
    }
  });
}
