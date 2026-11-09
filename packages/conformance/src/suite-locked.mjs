// Campo travado depois de gravado (spec/README.md, "Campo travado depois de gravado"): `readOnly` (criado em do
// cliente), `createOnly` (login do operador) e `readOnlyWhen` sobre o registro gravado (total do pedido cancelado).

import assert from 'node:assert/strict';

const fieldCodes = (res, key) => (res.body?.error?.fields?.[key] ?? []).map((e) => e.code);

export function lockedTests({ test, call, as, tag, nextNumber }) {
  test('travado', 'readOnly no PATCH: outro valor → 422 read_only e nada muda; o mesmo valor passa', async () => {
    const created = await call('POST', '/customer', { name: `RO ${tag}` });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const { id, created_at } = created.body.data;
    const changed = await call('PATCH', `/customer/${id}`, { name: `RO 2 ${tag}`, created_at: '2000-01-01T00:00:00Z' });
    assert.equal(changed.status, 422, 'antes era 200 sem gravar: o cliente achava que tinha mudado');
    assert.deepEqual(fieldCodes(changed, 'created_at'), ['read_only']);
    assert.equal((await call('GET', `/customer/${id}`)).body.data.name, `RO ${tag}`, 'a recusa não grava o resto');
    const same = await call('PATCH', `/customer/${id}`, { name: `RO 3 ${tag}`, created_at });
    assert.equal(same.status, 200, 'o registro lido de volta, com o mesmo valor');
    assert.equal(same.body.data.name, `RO 3 ${tag}`);
  });

  test('travado', 'createOnly: informa na criação; mudar depois → 422 read_only; o mesmo valor passa', async () => {
    const login = `trava.${tag}`.toLowerCase();
    const created = await call('POST', '/operator', { name: `Trava ${tag}`, login, password: 'segredo1' });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const id = created.body.data.id;
    const changed = await call('PATCH', `/operator/${id}`, { login: `${login}.2` });
    assert.equal(changed.status, 422);
    assert.deepEqual(fieldCodes(changed, 'login'), ['read_only']);
    const same = await call('PATCH', `/operator/${id}`, { name: `Trava 2 ${tag}`, login, password: '' });
    assert.equal(same.status, 200, 'registro inteiro de volta, com o mesmo login e a senha vazia');
    assert.equal(same.body.data.login, login);
  });

  test('travado', 'readOnlyWhen vale sobre o gravado: total livre no pedido aberto, travado depois de cancelar', async () => {
    const order = await as(null, 1).post('/sales_order', { number: nextNumber(), description: `Trava ${tag}`, total: '10.00' });
    assert.equal(order.status, 201, JSON.stringify(order.body));
    const id = order.body.data.id;
    assert.equal((await as(null, 1).patch(`/sales_order/${id}`, { total: '12.50' })).body.data.total, '12.50');
    const reason = 'Cliente desistiu antes da entrega.';
    assert.equal((await as(null, 1).post(`/sales_order/${id}/_actions/cancel`, { reason })).status, 200);
    const locked = await as(null, 1).patch(`/sales_order/${id}`, { total: '1.00' });
    assert.equal(locked.status, 422);
    assert.deepEqual(fieldCodes(locked, 'total'), ['read_only']);
    const same = await as(null, 1).patch(`/sales_order/${id}`, { total: '12.5', description: `Outra ${tag}` });
    assert.equal(same.status, 200, 'mesmo valor em outra grafia passa; o resto do registro muda');
    assert.equal(same.body.data.description, `Outra ${tag}`);
  });
}
