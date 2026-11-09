// Grade no input e valores iniciais (spec/README.md, "Grade no input e valores iniciais"): product.reprice é ação da
// lista com `prefill` e uma grade `prices` (produto readOnly + preço novo). Erro de linha vem em prices.<i>.<campo>.

import assert from 'node:assert/strict';

const fieldCodes = (res, key) => (res.body?.error?.fields?.[key] ?? []).map((e) => e.code);

export function gridTests({ test, as, call, tag }) {
  const reprice = (input) => call('POST', '/product/_actions/reprice', { input });
  const product = async (name, price) => {
    const res = await call('POST', '/product', { name: `${name} ${tag}`, product_group: 'drinks', price });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return res.body.data;
  };

  test('ações', 'grade no input: prefill traz as linhas do sistema e a ação grava todas', async () => {
    const [agua, suco] = [await product('Água', '4.00'), await product('Suco', '9.50')];
    const pre = await call('GET', '/product/_actions/reprice/_prefill');
    assert.equal(pre.status, 200, JSON.stringify(pre.body));
    assert.deepEqual(Object.keys(pre.body.data), ['prices']);
    // só as colunas da grade: o exemplo manda também `cents`, que o motor tira
    const line = pre.body.data.prices.find((l) => l.product?.id === agua.id);
    assert.deepEqual(line, { product: { id: agua.id, title: agua.name }, price: '4.00' });
    // reference aceita o { id, title } do prefill ou só o id
    const res = await reprice({ prices: [line && { ...line, price: '4.5' }, { product: suco.id, price: '10.00' }] });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.match(res.body.message, /2 preço/);
    assert.equal((await call('GET', `/product/${agua.id}`)).body.data.price, '4.50');
    assert.equal((await call('GET', `/product/${suco.id}`)).body.data.price, '10.00');
  });

  test('ações', 'grade no input: erro por linha (422), lista vazia, formato (400) e rotas sem prefill (404)', async () => {
    const agua = await product('Água 2', '4.00');
    const bad = await reprice({ prices: [{ product: agua.id, price: '1.00' }, { product: agua.id, price: '-1' }, { product: agua.id }] });
    assert.equal(bad.status, 422, JSON.stringify(bad.body));
    assert.deepEqual(Object.keys(bad.body.error.fields).sort(), ['prices.1.price', 'prices.2.price']);
    assert.deepEqual(fieldCodes(bad, 'prices.1.price'), ['min']);
    assert.deepEqual(fieldCodes(bad, 'prices.2.price'), ['required']);
    assert.equal((await call('GET', `/product/${agua.id}`)).body.data.price, '4.00', 'nada gravado');
    assert.deepEqual(fieldCodes(await reprice({ prices: [] }), 'prices'), ['min_items']);
    assert.deepEqual(fieldCodes(await reprice({}), 'prices'), ['min_items']);
    assert.equal((await reprice({ prices: { product: agua.id } })).status, 400);
    assert.equal((await reprice({ prices: [{ product: agua.id, price: '1.00', extra: 1 }] })).status, 400);
    assert.equal((await reprice({ prices: ['x'] })).status, 400);
    assert.equal(
      (await call('GET', `/product/${agua.id}/_actions/reprice/_prefill`)).status,
      404,
      'ação da lista não tem rota de registro'
    );
    assert.equal((await as(null, 1).get('/seller/_actions/apply_schedule/_prefill')).status, 404, 'ação sem prefill');
  });
}
