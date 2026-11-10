// Busca do Ctrl K (spec/v0/search.yaml): GET /_search. O exemplo procura produtos pelo nome; a suíte cria um com
// nome único e confere o formato, o corte no `limit` e os 400 de `q` curto e `limit` fora da faixa.

import assert from 'node:assert/strict';

export function searchTests({ test, call, tag }) {
  test('search', 'acha o registro pelo texto, no formato da paleta', async () => {
    const name = `Pão de busca ${tag}`;
    const created = await call('POST', '/product', { name, product_group: 'dishes', price: '7.50' });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const res = await call('GET', `/_search?q=${encodeURIComponent(`busca ${tag}`)}`);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    const hit = res.body.data.find((h) => h.title === name);
    assert.ok(hit, JSON.stringify(res.body));
    assert.equal(hit.path, `/product/${created.body.data.id}`);
    for (const key of ['kind', 'group', 'title', 'path']) assert.equal(typeof hit[key], 'string', key);
    for (const key of ['snippet', 'icon', 'at']) assert.ok(key in hit, key);
  });

  test('search', 'limit corta a lista', async () => {
    const one = await call('GET', `/_search?q=${encodeURIComponent('Pão de busca')}&limit=1`);
    assert.equal(one.status, 200, JSON.stringify(one.body));
    assert.ok(one.body.data.length <= 1);
  });

  test('search', 'q curto ou limit fora da faixa: 400', async () => {
    for (const q of ['', 'q=a', 'q=%20%20e%20%20', 'q=pao&limit=0', 'q=pao&limit=51', 'q=pao&limit=dez']) {
      const res = await call('GET', `/_search?${q}`);
      assert.equal(res.status, 400, `${q}: ${res.status}`);
      assert.ok(res.body.error, q);
    }
  });
}
