// Filtro no reference (spec/README.md, "Filtro no reference"): pedido não aponta para cliente perdido; "indicado
// por" só aceita outro cliente da mesma empresa (variáveis $field com o próprio id e a empresa do formulário).

import assert from 'node:assert/strict';

const fieldCodes = (res, key) => (res.body?.error?.fields?.[key] ?? []).map((e) => e.code);

export function refFilterTests({ test, call, as, tag, nextNumber }) {
  const customer = async (fields) => {
    const res = await call('POST', '/customer', { status: 'lead', ...fields, name: `${fields.name} ${tag}` });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return res.body.data;
  };
  const company = async (name) => (await call('POST', '/company', { trade_name: `${name} ${tag}` })).body.data;

  test('filtro', 'filter fixo: opção fora dele → 422 not_allowed; dentro passa', async () => {
    const lost = await customer({ name: 'Perdido', status: 'churned', churn_reason: 'preço' });
    const ok = await customer({ name: 'Ativo', status: 'active' });
    const order = (customer_id) => as(null, 1).post('/sales_order', { number: nextNumber(), description: `Filtro ${tag}`, customer_id });
    const refused = await order(lost.id);
    assert.equal(refused.status, 422);
    assert.deepEqual(fieldCodes(refused, 'customer_id'), ['not_allowed']);
    assert.equal((await order(ok.id)).status, 201);
  });

  test('filtro', '$field: indicado por outro cliente da mesma empresa, nunca ele mesmo', async () => {
    const [a, b] = [await company('Filtro A'), await company('Filtro B')];
    const ana = await customer({ name: 'Ana', company_id: a.id });
    const bia = await customer({ name: 'Bia', company_id: b.id });
    const other = await call('POST', '/customer', { name: `Caio ${tag}`, status: 'lead', company_id: a.id, referred_by: bia.id });
    assert.deepEqual(fieldCodes(other, 'referred_by'), ['not_allowed'], 'cliente de outra empresa');
    const caio = await customer({ name: 'Caio', company_id: a.id, referred_by: ana.id });
    assert.equal(caio.referred_by.id, ana.id);
    const self = await call('PATCH', `/customer/${ana.id}`, { referred_by: ana.id });
    assert.deepEqual(fieldCodes(self, 'referred_by'), ['not_allowed'], 'o próprio registro');
    const loose = await customer({ name: 'Sem empresa', referred_by: bia.id });
    assert.equal(loose.referred_by.id, bia.id, 'empresa vazia: a folha não restringe');
  });

  test('filtro', 'where da lista aceita id: a shell manda o filtro resolvido para montar as opções', async () => {
    const ana = await customer({ name: 'Lista' });
    const where = JSON.stringify({
      and: [
        { field: 'id', op: 'ne', value: ana.id },
        { field: 'name', op: 'contains', value: tag }
      ]
    });
    const res = await call('GET', `/customer?${new URLSearchParams({ where, pageSize: '100' })}`);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.ok(!res.body.data.some((c) => c.id === ana.id));
  });
}
