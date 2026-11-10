// Prévia da ação (spec/README.md, "Prévia da ação"): product.discount tem `preview: true`. O sistema calcula o preço
// novo, sugere em `fill` e mostra a tabela; nada é gravado, e falta de campo obrigatório não barra a prévia.

import assert from 'node:assert/strict';

const codes = (res, key) => (res.body?.error?.fields?.[key] ?? []).map((e) => e.code);

export function previewTests({ test, call, tag }) {
  test('ações', 'prévia: fill, mensagem e tabela do sistema; nada gravado; obrigatório vazio não barra', async () => {
    const created = await call('POST', '/product', { name: `Prato prévia ${tag}`, product_group: 'dishes', price: '28.90' });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const id = created.body.data.id;
    const preview = (input) => call('POST', `/product/${id}/_actions/discount/_preview`, input);

    const res = await preview({ percent: '10' });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.deepEqual(res.body.fill, { price: '26.01' });
    assert.equal(res.body.message, 'De R$ 28,90 para R$ 26,01.');
    assert.deepEqual(
      res.body.table.columns.map((c) => c.name),
      ['item', 'value']
    );
    assert.deepEqual(res.body.table.rows[2], { item: 'Preço novo', value: 'R$ 26,01' });

    const empty = await preview({});
    assert.equal(empty.status, 200, JSON.stringify(empty.body));
    assert.deepEqual(empty.body.fill, {});
    assert.equal(empty.body.table, null);

    assert.deepEqual(codes(await preview({ percent: '95' }), 'percent'), ['max']);
    assert.equal((await preview({ nope: 1 })).status, 400);
    assert.equal((await call('GET', `/product/${id}`)).body.data.price, '28.90', 'a prévia não grava');

    const run = await call('POST', `/product/${id}/_actions/discount`, { percent: '10', price: '25.00' });
    assert.equal(run.status, 200, JSON.stringify(run.body));
    assert.equal(run.body.data.price, '25.00', 'grava o valor confirmado, não o sugerido');
  });

  test('ações', 'prévia: ação sem preview ou rota errada → 404', async () => {
    const created = await call('POST', '/product', { name: `Sem prévia ${tag}`, product_group: 'drinks', price: '5.00' });
    const id = created.body.data.id;
    assert.equal((await call('POST', `/product/${id}/_actions/duplicate/_preview`, {})).status, 404);
    assert.equal(
      (await call('POST', '/product/_actions/discount/_preview', { input: {} })).status,
      404,
      'ação de registro pela rota da lista'
    );
    assert.equal((await call('POST', '/product/999999/_actions/discount/_preview', {})).status, 404);
  });

  test('ações', 'prévia: fill refaz a grade do input só com as colunas dela', async () => {
    const agua = await call('POST', '/product', { name: `Água fill ${tag}`, product_group: 'drinks', price: '4.00' });
    assert.equal(agua.status, 201, JSON.stringify(agua.body));
    const preview = (input) => call('POST', '/product/_actions/reprice/_preview', { input });
    const res = await preview({ percent: '10' });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    // o exemplo manda também `cents`, que a grade não declara: o motor tira
    const line = res.body.fill.prices.find((l) => l.product?.id === agua.body.data.id);
    assert.deepEqual(line, { product: { id: agua.body.data.id, title: agua.body.data.name }, price: '4.40' });
    assert.deepEqual((await preview({})).body.fill, {}, 'sem o percentual, a grade fica');
  });
}
