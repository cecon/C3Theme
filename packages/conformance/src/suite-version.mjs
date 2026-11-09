// Versão do registro e Desfazer (spec/README.md, "Versão e Desfazer"): `_version` em toda resposta, If-Match com
// versão velha → 412 sem gravar, e C3-Undo conferido pelo backend (If-Match obrigatório, undoable, inverse).

import assert from 'node:assert/strict';
import { assertError } from './assertions.mjs';

export function versionTests({ test, call, newCustomer, newOrder, as, tag }) {
  const ifMatch = (v, undo) => ({ 'if-match': `"${v}"`, ...(undo && { 'c3-undo': 'true' }) });

  test('versão', '_version vem na leitura, na lista e na gravação, e muda quando o registro muda', async () => {
    const c = await newCustomer({ name: 'Versão' });
    assert.equal(typeof c._version, 'string', 'POST sem _version');
    const read = (await call('GET', `/customer/${c.id}`)).body.data;
    assert.equal(read._version, c._version, 'leitura e criação dão versões diferentes');
    const where = JSON.stringify({ field: 'id', op: 'eq', value: c.id });
    const row = (await call('GET', `/customer?${new URLSearchParams({ where })}`)).body.data[0];
    assert.equal(row._version, c._version, 'lista e leitura dão versões diferentes');
    const res = await call('PATCH', `/customer/${c.id}`, { notes: '11999990000' });
    assert.notEqual(res.body.data._version, c._version, 'a versão não mudou depois de alterar');
  });

  test('versão', '_version devolvida no corpo é ignorada: não rejeita, não grava e não vale como If-Match', async () => {
    const c = await newCustomer({ name: 'Versão no corpo' });
    const res = await call('PATCH', `/customer/${c.id}`, { _version: 'velha', notes: 'com o registro inteiro' });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.data.notes, 'com o registro inteiro');
    assert.notEqual(res.body.data._version, 'velha', 'a _version do corpo foi gravada');
    const back = (await call('GET', `/customer/${c.id}`)).body.data;
    assert.equal(back._version, res.body.data._version);
  });

  test('versão', 'If-Match com versão velha → 412 stale e nada muda; com a atual grava', async () => {
    const c = await newCustomer({ name: `Versão velha ${tag}` });
    const changed = await call('PATCH', `/customer/${c.id}`, { notes: '1133334444' });
    assertError(await call('PATCH', `/customer/${c.id}`, { notes: '1100000000' }, ifMatch(c._version)), 412, 'stale');
    assertError(await call('DELETE', `/customer/${c.id}`, undefined, ifMatch(c._version)), 412, 'stale');
    assert.equal((await call('GET', `/customer/${c.id}`)).body.data.notes, '1133334444');
    const ok = await call('PATCH', `/customer/${c.id}`, { notes: '1100000000' }, ifMatch(changed.body.data._version));
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    const star = await call('PATCH', `/customer/${c.id}`, { notes: '1155556666' }, { 'if-match': '*' });
    assert.equal(star.status, 200, 'If-Match: * vale qualquer versão');
  });

  test('versão', 'ação com If-Match velho → 412 antes do visibleWhen; nada roda', async () => {
    const c = await newCustomer({ name: 'Versão ação' });
    await call('PATCH', `/customer/${c.id}`, { notes: '1144445555' });
    assertError(await call('POST', `/customer/${c.id}/_actions/churn`, { reason: 'price' }, ifMatch(c._version)), 412, 'stale');
    assert.equal((await call('GET', `/customer/${c.id}`)).body.data.status, 'lead');
  });

  test('desfazer', 'Desfazer volta os campos com a versão de depois; sem If-Match → 400', async () => {
    const c = await newCustomer({ name: 'Desfazer' });
    const after = (await call('PATCH', `/customer/${c.id}`, { notes: '1122223333' })).body.data;
    assertError(await call('PATCH', `/customer/${c.id}`, { notes: null }, { 'c3-undo': 'true' }), 400, 'bad_request');
    const undo = await call('PATCH', `/customer/${c.id}`, { notes: null }, ifMatch(after._version, true));
    assert.equal(undo.status, 200, JSON.stringify(undo.body));
    assert.equal(undo.body.data.notes, null);
    // o mesmo Desfazer de novo: o registro já não está na versão de depois
    assertError(await call('PATCH', `/customer/${c.id}`, { notes: null }, ifMatch(after._version, true)), 412, 'stale');
  });

  test('desfazer', 'Desfazer não apaga edição feita depois por outra pessoa', async () => {
    const c = await newCustomer({ name: 'Desfazer criação' });
    await call('PATCH', `/customer/${c.id}`, { notes: '1177778888' });
    assertError(await call('DELETE', `/customer/${c.id}`, undefined, ifMatch(c._version, true)), 412, 'stale');
    assert.equal((await call('GET', `/customer/${c.id}`)).status, 200, 'o registro editado depois foi apagado');
    const fresh = await newCustomer({ name: 'Desfazer criação ok' });
    assert.equal((await call('DELETE', `/customer/${fresh.id}`, undefined, ifMatch(fresh._version, true))).status, 204);
  });

  test('desfazer', 'ação que não é inverse de outra não roda como Desfazer → 409', async () => {
    const c = await newCustomer({ name: 'Desfazer ação', status: 'churned', churn_reason: 'teste' });
    assertError(await call('POST', `/customer/${c.id}/_actions/reactivate`, undefined, ifMatch(c._version, true)), 409, 'conflict');
    assert.equal((await call('GET', `/customer/${c.id}`)).body.data.status, 'churned');
  });

  test('desfazer', 'entidade undoable false (pedido) recusa Desfazer → 409; o CRUD segue', async () => {
    const o = await newOrder(null, 1);
    assertError(await as(null, 1).del(`/sales_order/${o.id}`, ifMatch(o._version, true)), 409, 'conflict');
    assert.equal((await as(null, 1).get(`/sales_order/${o.id}`)).status, 200);
  });
}
