// Grade preenchida com as linhas marcadas (spec/README.md, "Grade com as linhas marcadas"): product.labels é ação
// em conjunto com a grade `items` em `fromSelection: "product"`. Cada linha é um produto marcado com a sua quantidade;
// o motor confere que as linhas são exatamente a seleção.

import assert from 'node:assert/strict';
import { assertFieldError } from './assertions.mjs';

export function selectionTests({ test, call, tag }) {
  const labels = (body) => call('POST', '/product/_actions/labels', body);
  const product = async (name, price) => {
    const res = await call('POST', '/product', { name: `${name} ${tag}`, product_group: 'drinks', price });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return res.body.data;
  };

  test('ações', 'grade fromSelection: uma linha por marcado, cada uma com o seu valor', async () => {
    const [a, b] = [await product('Etiqueta A', '3.00'), await product('Etiqueta B', '5.00')];
    const items = [
      { product: a.id, price: '3.00', copies: 2 },
      { product: { id: b.id, title: b.name }, price: '5.00', copies: 5 }
    ];
    const res = await labels({ ids: [a.id, b.id], input: { items } });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.message, '7 etiqueta(s) de 2 produto(s) na fila da impressora.');
  });

  test('ações', 'grade fromSelection: linha fora da seleção, faltando ou repetida → 422 na grade', async () => {
    const [a, b] = [await product('Etiqueta C', '3.00'), await product('Etiqueta D', '5.00')];
    const line = (p) => ({ product: p.id, price: '1.00', copies: 1 });
    assertFieldError(await labels({ ids: [a.id, b.id], input: { items: [line(a)] } }), 'items', 'selection');
    assertFieldError(await labels({ ids: [a.id], input: { items: [line(a), line(a)] } }), 'items', 'selection');
    assertFieldError(await labels({ ids: [a.id], input: { items: [line(b)] } }), 'items', 'selection');
    // no registro sozinho, a grade é só ele
    assertFieldError(await call('POST', `/product/${a.id}/_actions/labels`, { items: [line(b)] }), 'items', 'selection');
    assert.equal((await call('POST', `/product/${a.id}/_actions/labels`, { items: [line(a)] })).status, 200);
  });
}
