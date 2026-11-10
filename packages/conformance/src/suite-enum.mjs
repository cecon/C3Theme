// Enum com o valor que o banco já grava (spec/README.md#tipos-de-campo-e-formato-trafegado):
// texto com maiúsculas e espaço (seller.channel) e inteiro (seller.commission_rule), sem tradução. E as opções
// vindas do próprio registro (`optionsFrom`, system_param.value lê a lista de system_param.options).

import assert from 'node:assert/strict';

const fieldCode = (res, field) => res.body?.error?.fields?.[field]?.[0]?.code;

export function enumTests({ test, as, call, tag }) {
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

  test('enum', 'optionsFrom: com a lista no registro, só um dos value (também no PATCH parcial); sem lista, texto livre', async () => {
    const options = JSON.stringify([
      { value: 'A', label: 'Opção A' },
      { value: 'B', label: 'Opção B' }
    ]);
    const param = (code, body) => call('POST', '/system_param', { code: `${code}_${tag}`, label: code, ...body });
    const ok = await param('lista', { options, value: 'B' });
    assert.equal(ok.status, 201, JSON.stringify(ok.body));
    assert.equal(ok.body.data.value, 'B');
    const bad = await param('fora', { options, value: 'C' });
    assert.equal(bad.status, 422, JSON.stringify(bad.body));
    assert.equal(fieldCode(bad, 'value'), 'invalid_option');
    // PATCH só do valor: a lista vem do registro gravado
    const patch = await call('PATCH', `/system_param/${ok.body.data.id}`, { value: 'Z' });
    assert.equal(fieldCode(patch, 'value'), 'invalid_option', JSON.stringify(patch.body));
    assert.equal((await call('PATCH', `/system_param/${ok.body.data.id}`, { value: 'A' })).status, 200);
    for (const free of [undefined, '[]', 'não é JSON']) {
      const res = await param(`livre${free === undefined ? '' : free.length}`, { options: free, value: 'qualquer texto' });
      assert.equal(res.status, 201, `${free}: ${JSON.stringify(res.body)}`);
    }
  });
}
