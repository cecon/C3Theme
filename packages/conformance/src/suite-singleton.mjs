// Entidade singleton (spec/README.md): um registro por escopo. Usa store_settings (scope branch). A suíte roda duas
// vezes no mesmo banco, então a primeira gravação de cada filial pode já ter acontecido.

import assert from 'node:assert/strict';

export function singletonTests({ test, as }) {
  test('singleton', 'um registro por filial: o segundo é 409, excluir é 405 e capabilities.delete é false', async () => {
    const api = as(null, 3);
    const first = await api.get('/store_settings');
    assert.equal(first.status, 200, JSON.stringify(first.body));
    let record = first.body.data[0];
    if (!record) {
      const created = await api.post('/store_settings', { receipt_footer: 'Volte sempre', fine_percent: '2.00' });
      assert.equal(created.status, 201, JSON.stringify(created.body));
      record = created.body.data;
    }
    const again = await api.post('/store_settings', { receipt_footer: 'Outro' });
    assert.equal(again.status, 409, JSON.stringify(again.body));
    assert.equal(again.body.error.code, 'conflict');

    assert.equal(record._can.delete, false, '_can.delete da linha também é false');
    const patched = await api.patch(`/store_settings/${record.id}`, { interest_month_percent: '1.00' });
    assert.equal(patched.status, 200, JSON.stringify(patched.body));
    assert.equal(patched.body.data.interest_month_percent, '1.00');

    const del = await api.del(`/store_settings/${record.id}`);
    assert.equal(del.status, 405, JSON.stringify(del.body));
    assert.equal(del.body.error.code, 'method_not_allowed');

    const meta = await api.get('/_meta/entities/store_settings');
    assert.equal(meta.body.capabilities.delete, false);
    assert.equal(meta.body.data.singleton, true);

    // outra filial tem o seu
    const other = as(null, 2);
    const list = await other.get('/store_settings');
    if (list.body.data.length === 0) assert.equal((await other.post('/store_settings', { receipt_footer: 'Centro' })).status, 201);
    assert.equal((await api.get('/store_settings')).body.data.length, 1, 'filial 3 continua com um só');
  });
}
