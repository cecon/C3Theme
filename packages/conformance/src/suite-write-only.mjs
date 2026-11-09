// Campo só de escrita (spec/README.md#tipos-de-campo-e-formato-trafegado, `writeOnly`): a senha do
// operador nunca volta na leitura, é obrigatória só na criação e não entra em filtro nem ordem.

import assert from 'node:assert/strict';

const fieldCode = (res, field) => res.body?.error?.fields?.[field]?.[0]?.code;

export function writeOnlyTests({ test, call, tag }) {
  test('writeOnly', 'senha: obrigatória ao criar, nunca volta na leitura, vazia na alteração mantém', async () => {
    const login = `op.${tag}`.toLowerCase();
    const missing = await call('POST', '/operator', { name: `Operador ${tag}`, login });
    assert.equal(missing.status, 422);
    assert.equal(fieldCode(missing, 'password'), 'required');
    const short = await call('POST', '/operator', { name: `Operador ${tag}`, login, password: '123' });
    assert.equal(fieldCode(short, 'password'), 'too_short');

    const created = await call('POST', '/operator', { name: `Operador ${tag}`, login, password: 'segredo1' });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.equal(created.body.data.password, null, 'a resposta da criação não traz a senha');
    const { id } = created.body.data;
    assert.equal((await call('GET', `/operator/${id}`)).body.data.password, null);
    const listed = await call('GET', `/operator?${new URLSearchParams({ q: tag })}`);
    assert.ok(listed.body.data.length > 0 && listed.body.data.every((o) => o.password === null), 'a lista também não');

    for (const password of [undefined, null, '']) {
      const res = await call('PATCH', `/operator/${id}`, { name: `Renomeado ${tag}`, ...(password === undefined ? {} : { password }) });
      assert.equal(res.status, 200, `PATCH com password ${JSON.stringify(password)} mantém a gravada: ${JSON.stringify(res.body)}`);
    }
    assert.equal((await call('PATCH', `/operator/${id}`, { password: 'outra-senha' })).status, 200);
  });

  test('writeOnly', 'filtrar, buscar ou ordenar pela senha → 400 (revelaria o valor gravado)', async () => {
    const where = JSON.stringify({ field: 'password', op: 'contains', value: 'a' });
    assert.equal((await call('GET', `/operator?${new URLSearchParams({ where })}`)).status, 400);
    assert.equal((await call('GET', '/operator?sort=password')).status, 400);
    const meta = await call('GET', '/_meta/entities/operator');
    assert.equal(meta.body.data.fields.find((f) => f.name === 'password').writeOnly, true, 'a shell sabe que é só de escrita');
  });
}
