// Enum com o valor que o banco já grava (spec/README.md#tipos-de-campo-e-formato-trafegado):
// texto com maiúsculas e espaço (seller.channel) e inteiro (seller.commission_rule), sem tradução.

import assert from 'node:assert/strict';

const fieldCode = (res, field) => res.body?.error?.fields?.[field]?.[0]?.code;

export function enumTests({ test, as, tag }) {
  const post = (body) => as(null, 1).post('/seller', { name: `Enum ${tag}`, ...body });
  const listed = async (where) => {
    const res = await as(null, 1).list('seller', {
      where: JSON.stringify({ and: [{ field: 'name', op: 'eq', value: `Enum ${tag}` }, where] })
    });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    return res.body.data.map((r) => r.id).sort();
  };

  test('enum', 'grava, lê e filtra o valor exato (texto com espaço e inteiro, inclusive 0)', async () => {
    const a = await post({ channel: 'TELE VENDAS', commission_rule: 0 });
    const b = await post({ channel: 'PISTA', commission_rule: 2 });
    assert.equal(a.status, 201, JSON.stringify(a.body));
    assert.equal(b.status, 201, JSON.stringify(b.body));
    assert.equal(a.body.data.channel, 'TELE VENDAS');
    assert.equal(a.body.data.commission_rule, 0, 'enum inteiro trafega como número');
    assert.deepEqual(await listed({ field: 'channel', op: 'eq', value: 'TELE VENDAS' }), [a.body.data.id]);
    assert.deepEqual(await listed({ field: 'commission_rule', op: 'in', value: [0, 1] }), [a.body.data.id]);
    assert.deepEqual(await listed({ field: 'commission_rule', op: 'null', value: true }), [], '0 não é vazio');
  });

  test('enum', 'comparação exata e tipo do valor: maiúscula errada → invalid_option, "2" num enum inteiro → invalid_type', async () => {
    const lower = await post({ channel: 'pista' });
    assert.equal(lower.status, 422, JSON.stringify(lower.body));
    assert.equal(fieldCode(lower, 'channel'), 'invalid_option');
    assert.equal(fieldCode(await post({ commission_rule: '2' }), 'commission_rule'), 'invalid_type');
    assert.equal(fieldCode(await post({ commission_rule: 9 }), 'commission_rule'), 'invalid_option');
    const where = JSON.stringify({ field: 'commission_rule', op: 'eq', value: '2' });
    assert.equal((await as(null, 1).list('seller', { where })).status, 400);
  });
}
