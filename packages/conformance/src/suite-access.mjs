// Permissão por linha, seção e campo (spec/README.md, "Permissão por linha, seção e campo"). Os códigos do exemplo:
// company.rowAccess (empresa.cliente vê quem não é fornecedor, empresa.fornecedor vê os fornecedores), a aba Fornecedor
// (view empresa.fornecedor), a lista Fiscal (edit empresa.fiscal) e customer.credit_limit (edit cliente.credito).
// `caio` só tem empresa.cliente; os outros usuários têm todos.

import assert from 'node:assert/strict';

const fieldCodes = (res, key) => (res.body?.error?.fields?.[key] ?? []).map((e) => e.code);

export function accessTests({ test, call, as, tag }) {
  const caio = as('caio');
  const company = async (fields) => {
    const res = await call('POST', '/company', { trade_name: `Acesso ${tag}`, ...fields });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return res.body.data;
  };

  test('permissão', 'capabilities.fields diz o que o usuário não vê e o que só lê', async () => {
    const meta = await caio.get('/_meta/entities/company');
    assert.equal(meta.status, 200);
    assert.deepEqual(meta.body.capabilities.fields, { supplier_terms: 'hidden', company_fiscal: 'readOnly' });
    assert.deepEqual((await caio.get('/_meta/entities/customer')).body.capabilities.fields, { credit_limit: 'readOnly' });
    assert.deepEqual((await call('GET', '/_meta/entities/company')).body.capabilities.fields, {});
  });

  test('permissão', 'rowAccess: sem o código de fornecedor, o fornecedor some da lista e da leitura, e não se grava', async () => {
    const supplier = await company({ trade_name: `Fornecedor ${tag}`, is_supplier: true, supplier_terms: 30 });
    const client = await company({ trade_name: `Cliente ${tag}` });
    const where = JSON.stringify({ field: 'trade_name', op: 'contains', value: tag });
    const seen = await caio.list('company', { where, pageSize: 100 });
    assert.equal(seen.status, 200);
    assert.ok(!seen.body.data.some((r) => r.id === supplier.id), 'fornecedor fora da lista');
    assert.ok(seen.body.data.some((r) => r.id === client.id));
    assert.equal(seen.body.meta.total, seen.body.data.length, 'total conta só o que ele vê');
    assert.equal((await caio.get(`/company/${supplier.id}`)).status, 404);
    assert.equal((await caio.patch(`/company/${supplier.id}`, { trade_name: 'x' })).status, 404);
    const read = await caio.get(`/company/${client.id}`);
    assert.equal(read.status, 200);
    assert.ok(!('supplier_terms' in read.body.data), 'campo da aba Fornecedor não vem');
    assert.equal((await caio.post('/company', { trade_name: `Novo ${tag}`, is_supplier: true })).status, 403);
    assert.equal((await caio.patch(`/company/${client.id}`, { is_supplier: true })).status, 403);
  });

  test(
    'permissão',
    'rowAccess com $user: a própria empresa aparece mesmo sendo fornecedor; sem o valor, a regra não mostra nada',
    async () => {
      const own = await company({ trade_name: `Própria ${tag}`, is_supplier: true, supplier_terms: 15 });
      const where = JSON.stringify({ field: 'id', op: 'eq', value: own.id });
      assert.equal((await as(`caio@${own.id}`).list('company', { where })).body.meta.total, 1);
      const read = await as(`caio@${own.id}`).get(`/company/${own.id}`);
      assert.equal(read.status, 200);
      assert.ok(!('supplier_terms' in read.body.data), 'a linha aparece, o campo continua escondido');
      assert.equal((await caio.list('company', { where })).body.meta.total, 0);
    }
  );

  test('permissão', 'campo que o usuário não vê não filtra nem ordena (400)', async () => {
    const where = JSON.stringify({ field: 'supplier_terms', op: 'gt', value: 10 });
    assert.equal((await caio.list('company', { where })).status, 400);
    assert.equal((await caio.list('company', { sort: 'supplier_terms' })).status, 400);
    assert.equal((await call('GET', `/company?${new URLSearchParams({ where })}`)).status, 200);
  });

  test('permissão', 'campo só de leitura: mudar → 422 forbidden; o mesmo valor passa; na criação vale o padrão', async () => {
    const created = await call('POST', '/customer', { name: `Crédito ${tag}`, status: 'lead', credit_limit: '100.00' });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const id = created.body.data.id;
    const changed = await caio.patch(`/customer/${id}`, { credit_limit: '200.00' });
    assert.equal(changed.status, 422);
    assert.deepEqual(fieldCodes(changed, 'credit_limit'), ['forbidden']);
    const same = await caio.patch(`/customer/${id}`, { credit_limit: '100', name: `Crédito 2 ${tag}` });
    assert.equal(same.status, 200, JSON.stringify(same.body));
    assert.equal(same.body.data.credit_limit, '100.00');
    assert.deepEqual(
      fieldCodes(await caio.post('/customer', { name: `Novo ${tag}`, status: 'lead', credit_limit: '5.00' }), 'credit_limit'),
      ['forbidden']
    );
    assert.equal((await caio.post('/customer', { name: `Novo ${tag}`, status: 'lead' })).status, 201);
  });

  test('permissão', 'lista with_parent só de leitura: vem na leitura, mas não pode vir no corpo', async () => {
    const c = await company({ trade_name: `Fiscal ${tag}` });
    assert.ok(Array.isArray((await caio.get(`/company/${c.id}`)).body.data.company_fiscal));
    const sent = await caio.patch(`/company/${c.id}`, { company_fiscal: [] });
    assert.equal(sent.status, 422);
    assert.deepEqual(fieldCodes(sent, 'company_fiscal'), ['forbidden']);
    assert.equal((await caio.patch(`/company/${c.id}`, { trade_name: `Fiscal 2 ${tag}` })).status, 200);
  });
}
