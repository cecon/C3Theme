// Filhos gravados junto com o pai (spec/README.md, "Filhos gravados junto com o pai"):
// contatos da empresa (gravados pelo motor) e itens do pedido (gravados pelo escritor do sistema).

import assert from 'node:assert/strict';

const fieldCodes = (res, key) => (res.body?.error?.fields?.[key] ?? []).map((e) => e.code);

function expectStatus(res, status, code) {
  assert.equal(res.status, status, `esperado HTTP ${status}, veio ${res.status}: ${JSON.stringify(res.body)}`);
  if (code) assert.equal(res.body?.error?.code, code);
}

export function childrenTests({ test, call, as, tag, nextNumber }) {
  const contacts = (res) => res.body.data.company_contact.map((c) => c.name);
  const newCompany = (company_contact, name = 'Filhos') => call('POST', '/company', { trade_name: `${name} ${tag}`, company_contact });

  test('filhos', 'POST grava pai e filhos juntos; a leitura traz a lista na ordem da seção', async () => {
    const res = await newCompany([{ name: 'Zeca', email: `zeca.${tag}@ex.com` }, { name: 'Ana' }]);
    expectStatus(res, 201);
    assert.deepEqual(contacts(res), ['Ana', 'Zeca'], 'ordem do sort da seção (name)');
    const zeca = res.body.data.company_contact[1];
    assert.equal(typeof zeca.id, 'string');
    assert.equal(zeca.main, false, 'default da filha');
    assert.deepEqual(zeca.company_id?.id, res.body.data.id, 'a coluna do pai é preenchida pelo motor');
    const got = await call('GET', `/company/${res.body.data.id}`);
    assert.deepEqual(contacts(got), ['Ana', 'Zeca']);
    const listed = await call('GET', `/company?${new URLSearchParams({ q: tag, pageSize: '100' })}`);
    assert.ok(
      listed.body.data.every((c) => !('company_contact' in c)),
      'a listagem não traz filhos'
    );
  });

  test('filhos', 'PATCH com a lista substitui: com id altera, sem id inclui, o que não veio sai; sem a chave, nada muda', async () => {
    const created = (await newCompany([{ name: 'A' }, { name: 'B' }])).body.data;
    const [a] = created.company_contact;
    const res = await call('PATCH', `/company/${created.id}`, { company_contact: [{ id: a.id, name: 'A2' }, { name: 'C' }] });
    expectStatus(res, 200);
    assert.deepEqual(contacts(res), ['A2', 'C']);
    assert.equal(res.body.data.company_contact[0].id, a.id, 'a linha alterada mantém o id');
    const kept = await call('PATCH', `/company/${created.id}`, { trade_name: `Outro ${tag}` });
    assert.deepEqual(contacts(kept), ['A2', 'C']);
    const emptied = await call('PATCH', `/company/${created.id}`, { company_contact: [] });
    assert.deepEqual(contacts(emptied), []);
  });

  test('filhos', 'erro por linha volta como {filha}.{posição}.{campo}, junto com os do pai, e nada é gravado', async () => {
    const res = await call('POST', '/company', {
      trade_name: '',
      company_contact: [{ name: 'Ok' }, { email: 'não é e-mail' }]
    });
    expectStatus(res, 422, 'validation_failed');
    assert.deepEqual(fieldCodes(res, 'trade_name'), ['required']);
    assert.deepEqual(fieldCodes(res, 'company_contact.1.name'), ['required']);
    assert.deepEqual(fieldCodes(res, 'company_contact.1.email'), ['pattern']);
    assert.equal(res.body.error.fields['company_contact.0.name'], undefined);
    const many = await newCompany([{ name: '1' }, { name: '2' }, { name: '3' }, { name: '4' }]);
    expectStatus(many, 422);
    assert.deepEqual(fieldCodes(many, 'company_contact'), ['too_many'], 'maxItems 3 no exemplo');
  });

  test('filhos', 'unique da filha na mesma transação → 409 na linha certa e o pai não fica gravado', async () => {
    const name = `Duplicada ${Date.now()}`;
    const email = `dup.${tag}@ex.com`;
    const res = await newCompany(
      [
        { name: 'X', email },
        { name: 'Y', email }
      ],
      name
    );
    expectStatus(res, 409, 'conflict');
    assert.deepEqual(fieldCodes(res, 'company_contact.1.email'), ['unique']);
    assert.equal(res.body.error.fields['company_contact.1.company_id'], undefined, 'a coluna do pai não é erro da linha');
    const where = JSON.stringify({ field: 'trade_name', op: 'eq', value: `${name} ${tag}` });
    assert.equal((await call('GET', `/company?${new URLSearchParams({ where })}`)).body.meta.total, 0, 'rollback do pai');
  });

  test('filhos', 'corpo inválido: não-lista e campo desconhecido → 400; id de outro pai → 422 not_found', async () => {
    expectStatus(await newCompany({ name: 'x' }), 400, 'bad_request');
    expectStatus(await newCompany(['x']), 400, 'bad_request');
    expectStatus(await newCompany([{ name: 'x', nope: 1 }]), 400, 'bad_request');
    const other = (await newCompany([{ name: 'De outro' }])).body.data;
    const mine = (await newCompany([])).body.data;
    const stolen = await call('PATCH', `/company/${mine.id}`, { company_contact: [{ id: other.company_contact[0].id, name: 'Roubado' }] });
    expectStatus(stolen, 422);
    assert.deepEqual(fieldCodes(stolen, 'company_contact.0.id'), ['not_found']);
    const twice = [{ id: other.company_contact[0].id }, { id: other.company_contact[0].id }];
    expectStatus(await call('PATCH', `/company/${other.id}`, { company_contact: twice }), 400, 'bad_request');
    assert.deepEqual(contacts(await call('GET', `/company/${other.id}`)), ['De outro']);
  });

  test('filhos', 'a filha só se grava pelo pai: CRUD direto → 403 e capabilities sem escrita; excluir o pai leva os filhos', async () => {
    const meta = await call('GET', '/_meta/entities/company_contact');
    assert.deepEqual([meta.body.capabilities.create, meta.body.capabilities.update, meta.body.capabilities.delete], [false, false, false]);
    assert.equal(meta.body.capabilities.read, true);
    const company = (await newCompany([{ name: 'Direto' }])).body.data;
    const child = company.company_contact[0];
    expectStatus(await call('POST', '/company_contact', { company_id: company.id, name: 'x' }), 403, 'forbidden');
    expectStatus(await call('PATCH', `/company_contact/${child.id}`, { name: 'x' }), 403, 'forbidden');
    expectStatus(await call('DELETE', `/company_contact/${child.id}`), 403, 'forbidden');
    expectStatus(await call('DELETE', `/company/${company.id}`), 204);
    expectStatus(await call('GET', `/company_contact/${child.id}`), 404, 'not_found');
  });

  test('filhos', 'filha de uma linha (maxItems 1): grava, lê como lista de uma, recusa duas e sai com []', async () => {
    const fiscal = { tax_regime: 'simples', state_registration: '123' };
    const res = await call('POST', '/company', { trade_name: `Fiscal ${tag}`, company_fiscal: [fiscal] });
    expectStatus(res, 201);
    assert.deepEqual(
      res.body.data.company_fiscal.map((f) => [f.tax_regime, f.state_registration, f.municipal_registration]),
      [['simples', '123', null]]
    );
    const id = res.body.data.id;
    const two = await call('PATCH', `/company/${id}`, { company_fiscal: [fiscal, fiscal] });
    expectStatus(two, 422);
    assert.deepEqual(fieldCodes(two, 'company_fiscal'), ['too_many']);
    const empty = await call('PATCH', `/company/${id}`, { company_fiscal: [{}] });
    assert.deepEqual(fieldCodes(empty, 'company_fiscal.0.tax_regime'), ['required'], 'linha obrigatória vazia: erro nos campos');
    expectStatus(await call('PATCH', `/company/${id}`, { company_fiscal: [] }), 200);
    assert.deepEqual((await call('GET', `/company/${id}`)).body.data.company_fiscal, []);
  });

  test('filhos', 'escrita delegada: o escritor do sistema grava pedido e itens; itens herdam a filial do pedido', async () => {
    const order = { number: nextNumber(), description: `Itens ${tag}` };
    const bad = await as(null, 1).post('/sales_order', { ...order, sales_order_item: [{ product: 'Gasolina', quantity: 0 }] });
    expectStatus(bad, 422);
    assert.deepEqual(fieldCodes(bad, 'sales_order_item.0.quantity'), ['min']);
    const res = await as(null, 1).post('/sales_order', {
      ...order,
      sales_order_item: [{ product: 'Gasolina', quantity: 2, unit_price: '6.39' }, { product: 'Água' }]
    });
    expectStatus(res, 201);
    const items = res.body.data.sales_order_item;
    assert.deepEqual(
      items.map((i) => [i.product, i.quantity, i.unit_price, i._branch?.id]),
      [
        ['Gasolina', 2, '6.39', '1'],
        ['Água', 1, null, '1']
      ]
    );
    const patched = await as(null, 1).patch(`/sales_order/${res.body.data.id}`, {
      sales_order_item: [{ id: items[1].id, quantity: 3 }]
    });
    expectStatus(patched, 200);
    assert.deepEqual(
      patched.body.data.sales_order_item.map((i) => [i.id, i.product, i.quantity]),
      [[items[1].id, 'Água', 3]]
    );
    expectStatus(await as('beto', 3).get(`/sales_order_item/${items[1].id}`), 404, 'not_found');
  });
}
