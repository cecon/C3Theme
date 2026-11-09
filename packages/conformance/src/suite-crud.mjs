// Metadados e CRUD: criar, validar, ler, alterar e excluir (o formato trafegado e os erros do contrato).

import assert from 'node:assert/strict';
import { DATETIME, assertError, assertFieldError, assertSchema } from './assertions.mjs';

export function crudTests({ test, call, newCompany, newCustomer, state, tag }) {
  // ---------------- metadados ----------------

  test('meta', 'GET /_meta/app devolve um app válido', async () => {
    const res = await call('GET', '/_meta/app');
    assert.equal(res.status, 200);
    assertSchema('app.schema.json', res.body.data);
    for (const e of ['company', 'customer']) assert.ok(res.body.data.entities.includes(e), `app.entities sem '${e}'`);
  });

  test('meta', 'GET /_meta/entities/{e} devolve entidade válida e capabilities', async () => {
    for (const e of ['company', 'customer']) {
      const res = await call('GET', `/_meta/entities/${e}`);
      assert.equal(res.status, 200);
      assertSchema('entity.schema.json', res.body.data);
      for (const c of ['list', 'read', 'create', 'update', 'delete'])
        assert.equal(typeof res.body.capabilities?.[c], 'boolean', `capabilities.${c}`);
      const actions = res.body.capabilities?.actions;
      assert.ok(actions && typeof actions === 'object' && !Array.isArray(actions), 'capabilities.actions precisa ser objeto');
      assert.deepEqual(Object.keys(actions).sort(), (res.body.data.actions ?? []).map((a) => a.name).sort(), 'uma chave por ação');
      for (const v of Object.values(actions)) assert.equal(typeof v, 'boolean');
    }
    const customer = (await call('GET', '/_meta/entities/customer')).body.data;
    state.types = Object.fromEntries(customer.fields.map((f) => [f.name, f.type]));
  });

  test('meta', 'entidade inexistente → 404 not_found', async () => {
    assertError(await call('GET', '/_meta/entities/nao_existe'), 404, 'not_found');
    assertError(await call('GET', '/nao_existe'), 404, 'not_found');
  });

  // ---------------- criação e formato ----------------

  test('crud', 'POST cria e devolve o registro no formato trafegado', async () => {
    const company = await newCompany('Acme');
    assert.equal(typeof company.id, 'string');
    const c = await newCustomer({
      name: 'Maria',
      email: `maria.${tag}@exemplo.com`,
      company_id: company.id,
      status: 'active',
      credit_limit: '1234.5',
      birth_date: '1990-05-01',
      vip: true,
      notes: 'linha 1\nlinha 2'
    });
    assert.equal(typeof c.id, 'string');
    assert.equal(c.credit_limit, '1234.50', 'decimal volta como string com scale casas');
    assert.deepEqual(c.company_id, { id: company.id, title: `Acme ${tag}` }, 'reference lido vem { id, title }');
    assert.equal(c.vip, true);
    assert.equal(c.birth_date, '1990-05-01');
    assert.match(c.created_at, DATETIME, 'datetime em UTC, segundos, Z');
    assert.equal(c.notes, 'linha 1\nlinha 2');
  });

  test('crud', 'campo sem valor vem null, nunca ausente; default aplicado', async () => {
    const res = await call('POST', '/customer', { name: `Mínimo ${tag}` });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    state.customers.push(res.body.data);
    const meta = (await call('GET', '/_meta/entities/customer')).body.data;
    for (const f of meta.fields) assert.ok(f.name in res.body.data, `campo '${f.name}' ausente`);
    assert.equal(res.body.data.status, 'lead', 'default do enum');
    assert.equal(res.body.data.vip, false, 'default do boolean');
    assert.equal(res.body.data.email, null);
    assert.equal(res.body.data.company_id, null);
  });

  test('crud', 'id e campos readOnly enviados são ignorados', async () => {
    const res = await call('POST', '/customer', { id: '999999', name: `RO ${tag}`, created_at: '2000-01-01T00:00:00Z' });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    state.customers.push(res.body.data);
    assert.notEqual(res.body.data.id, '999999');
    assert.notEqual(res.body.data.created_at, '2000-01-01T00:00:00Z');
  });

  test('validação', 'obrigatório ausente → 422 required', async () => {
    assertFieldError(await call('POST', '/customer', { status: 'lead' }), 'name', 'required');
    assertFieldError(await call('POST', '/customer', { name: '' }), 'name', 'required');
  });

  test('validação', 'requiredWhen: perdido exige motivo', async () => {
    assertFieldError(await call('POST', '/customer', { name: `P ${tag}`, status: 'churned' }), 'churn_reason', 'required');
    const ok = await newCustomer({ name: 'Perdido', status: 'churned', churn_reason: 'preço' });
    assert.equal(ok.churn_reason, 'preço');
  });

  test('validação', 'visibleWhen: campo escondido não é guardado', async () => {
    const c = await newCustomer({ name: 'Ativo', status: 'active', churn_reason: 'não deveria ficar' });
    assert.equal(c.churn_reason, null);
  });

  test('validação', 'formato e regras por tipo', async () => {
    const n = `V ${tag}`;
    assertFieldError(await call('POST', '/customer', { name: n, status: 'xyz' }), 'status', 'invalid_option');
    assertFieldError(await call('POST', '/customer', { name: n, credit_limit: '1.234' }), 'credit_limit', 'invalid_type');
    assertFieldError(await call('POST', '/customer', { name: n, credit_limit: 10 }), 'credit_limit', 'invalid_type');
    assertFieldError(await call('POST', '/customer', { name: n, credit_limit: '-1.00' }), 'credit_limit', 'min');
    assertFieldError(await call('POST', '/customer', { name: n, birth_date: '2023-02-29' }), 'birth_date', 'invalid_type');
    assertFieldError(await call('POST', '/customer', { name: n, email: 'sem-arroba' }), 'email', 'pattern');
    assertFieldError(await call('POST', '/customer', { name: 'x'.repeat(121) }), 'name', 'too_long');
    assertFieldError(await call('POST', '/customer', { name: n, vip: 'sim' }), 'vip', 'invalid_type');
    assertFieldError(await call('POST', '/company', { trade_name: n, cnpj: '123' }), 'cnpj', 'pattern');
  });

  test('validação', 'vários erros voltam juntos', async () => {
    const res = await call('POST', '/customer', { status: 'xyz', credit_limit: 'abc' });
    const err = assertError(res, 422, 'validation_failed');
    for (const f of ['name', 'status', 'credit_limit']) assert.ok(err.fields[f], `faltou erro em ${f}`);
  });

  test('validação', 'reference para registro inexistente → 422 not_found', async () => {
    assertFieldError(await call('POST', '/customer', { name: `R ${tag}`, company_id: '987654321' }), 'company_id', 'not_found');
    assertFieldError(await call('POST', '/customer', { name: `R ${tag}`, company_id: 7 }), 'company_id', 'invalid_type');
  });

  test('validação', 'corpo inválido ou campo desconhecido → 400', async () => {
    assertError(await call('POST', '/customer', { name: `B ${tag}`, inventado: 1 }), 400, 'bad_request');
    assertError(await call('POST', '/customer', '[1,2]'), 400, 'bad_request');
    assertError(await call('POST', '/customer', '{quebrado'), 400, 'bad_request');
  });

  test('validação', 'unique → 409 conflict com o campo', async () => {
    const email = `dup.${tag}@exemplo.com`;
    await newCustomer({ name: 'Dup', email });
    assertFieldError(await call('POST', '/customer', { name: `Dup2 ${tag}`, email }), 'email', 'unique', 409);
  });

  // ---------------- leitura, alteração, exclusão ----------------

  test('crud', 'GET por id; inexistente ou malformado → 404', async () => {
    const c = state.customers[0];
    const res = await call('GET', `/customer/${c.id}`);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data, c);
    assertError(await call('GET', '/customer/987654321'), 404, 'not_found');
    assertError(await call('GET', '/customer/abc'), 404, 'not_found');
  });

  test('crud', 'PATCH altera só o enviado; null limpa; obrigatório não pode ser limpo', async () => {
    const c = await newCustomer({ name: 'Patch', notes: 'antes', credit_limit: '10.00' });
    const res = await call('PATCH', `/customer/${c.id}`, { notes: null, vip: true });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.data.notes, null);
    assert.equal(res.body.data.vip, true);
    assert.equal(res.body.data.credit_limit, '10.00');
    assert.equal(res.body.data.name, c.name);
    assertFieldError(await call('PATCH', `/customer/${c.id}`, { name: null }), 'name', 'required');
    assertFieldError(await call('PATCH', `/customer/${c.id}`, { status: 'churned' }), 'churn_reason', 'required');
    assertError(await call('PATCH', '/customer/987654321', { notes: 'x' }), 404, 'not_found');
  });

  test('crud', 'PATCH mantém reference existente sem reenviar', async () => {
    const company = await newCompany('Patch Co');
    const c = await newCustomer({ name: 'ComEmpresa', company_id: company.id });
    const res = await call('PATCH', `/customer/${c.id}`, { notes: 'x' });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.data.company_id?.id, company.id);
  });

  test('crud', 'DELETE: em uso → 409; senão 204 e some', async () => {
    const company = await newCompany('Del Co');
    const c = await newCustomer({ name: 'Del', company_id: company.id });
    assertError(await call('DELETE', `/company/${company.id}`), 409, 'conflict');
    const del = await call('DELETE', `/customer/${c.id}`);
    assert.equal(del.status, 204);
    assertError(await call('GET', `/customer/${c.id}`), 404, 'not_found');
    assertError(await call('DELETE', `/customer/${c.id}`), 404, 'not_found');
    assert.equal((await call('DELETE', `/company/${company.id}`)).status, 204);
    state.customers = state.customers.filter((x) => x.id !== c.id);
    state.companies = state.companies.filter((x) => x.id !== company.id);
  });
}
