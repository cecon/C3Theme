// Entidade lida de outro banco (spec/README.md, "Entidade de outro banco"): request_log mora no banco "logs" do
// exemplo. Lista, busca, filtro, totais e o registro aberto leem dali; gravar é 405.

import assert from 'node:assert/strict';

export function storeTests({ test, call }) {
  test('outro banco', 'lista, busca, filtro, totais e registro aberto leem do banco da entidade', async () => {
    const all = await call('GET', '/request_log?sort=id');
    assert.equal(all.status, 200, JSON.stringify(all.body));
    assert.equal(all.body.meta.total, 5);
    assert.equal(all.body.data[0].path, '/api/product');
    const q = await call('GET', '/request_log?q=sales_order');
    assert.deepEqual(
      q.body.data.map((r) => r.method),
      ['POST']
    );
    const where = encodeURIComponent(JSON.stringify({ field: 'status', op: 'gte', value: 400 }));
    const errors = await call('GET', `/request_log?where=${where}`);
    assert.equal(errors.body.meta.total, 2);
    const sum = await call('GET', '/request_log/_aggregate?measure=sum:duration_ms');
    assert.equal(sum.status, 200, JSON.stringify(sum.body));
    assert.equal(Number(sum.body.data[0].value), 220);
    const one = await call('GET', `/request_log/${all.body.data[4].id}`);
    assert.equal(one.status, 200, JSON.stringify(one.body));
    assert.equal(one.body.data.status, 500);
  });

  test('outro banco', 'só leitura: criar, alterar e excluir são 405; capabilities sem escrita', async () => {
    assert.equal((await call('POST', '/request_log', { method: 'GET', path: '/x', status: 200, duration_ms: 1 })).status, 405);
    assert.equal((await call('PATCH', '/request_log/1', { status: 201 })).status, 405);
    assert.equal((await call('DELETE', '/request_log/1')).status, 405);
    const meta = await call('GET', '/_meta/entities/request_log');
    assert.equal(meta.status, 200);
    const caps = meta.body.capabilities;
    assert.equal(caps.create, false);
    assert.equal(caps.update, false);
  });
}
