// Consultar e preencher (`lookups`): POST /{entity}/_lookups/{name} com { value }. O motor confere o valor de
// origem e o que o sistema devolve (só campos de fills); quem consulta a fonte externa é o sistema.

import assert from 'node:assert/strict';

const codes = (res, key) => (res.body?.error?.fields?.[key] ?? []).map((e) => e.code);

export function lookupTests({ test, call, as }) {
  const lookup = (name, body) => call('POST', `/company/_lookups/${name}`, body);

  test('consulta', 'CEP e CNPJ devolvem só campos de fills; sem resultado → 404, fonte fora → 503', async () => {
    const cep = await lookup('cep', { value: '01310100' });
    assert.equal(cep.status, 200, JSON.stringify(cep.body));
    assert.deepEqual(cep.body.data, { street: 'Avenida Paulista', city: 'São Paulo', state: 'SP' });
    const cnpj = await lookup('cnpj', { value: '11222333000181' });
    assert.deepEqual(cnpj.body.data, { trade_name: 'Empresa Exemplo' });

    assert.equal((await lookup('cep', { value: '00000000' })).body.error.code, 'not_found');
    const down = await lookup('cep', { value: '99999999' });
    assert.equal(down.status, 503);
    assert.equal(down.body.error.code, 'unavailable');
    // o sistema devolveu campo fora de fills: erro do sistema, nunca preenche
    assert.equal((await lookup('cnpj', { value: '11444777000161' })).status, 500);
  });

  test('consulta', 'valor de origem inválido → 422 no campo; corpo errado → 400; consulta desconhecida → 404', async () => {
    assert.deepEqual(codes(await lookup('cep', { value: '0131' }), 'zip_code'), ['pattern']);
    assert.deepEqual(codes(await lookup('cnpj', { value: '11222333000182' }), 'cnpj'), ['check_digit']);
    assert.deepEqual(codes(await lookup('cep', { value: '' }), 'zip_code'), ['required']);
    for (const bad of [{}, { value: 1 }, { value: '01310100', x: 1 }])
      assert.equal((await lookup('cep', bad)).status, 400, JSON.stringify(bad));
    assert.equal((await lookup('nope', { value: '01310100' })).status, 404);
  });

  test('consulta', 'quem só lê a entidade não consulta (403)', async () => {
    const res = await as('ana', 2).post('/company/_lookups/cep', { value: '01310100' });
    assert.equal(res.status, 403, JSON.stringify(res.body));
  });

  test('consulta', 'filha with_parent consulta com a permissão do pai: a filha só lê, o pai grava', async () => {
    // no exemplo, company_fiscal é só leitura para todos (como uma filha no Nati); quem grava é company
    const meta = await call('GET', '/_meta/entities/company_fiscal');
    assert.equal(meta.body.capabilities.update, false);
    const ok = await call('POST', '/company_fiscal/_lookups/sintegra', { value: '110042490114' });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    assert.deepEqual(ok.body.data, { tax_regime: 'presumido' });
    // filha de várias linhas (contatos), consultada no diálogo da linha
    const cep = await call('POST', '/company_contact/_lookups/cep', { value: '01310100' });
    assert.deepEqual(cep.body.data, { street: 'Avenida Paulista', city: 'São Paulo', state: 'SP' });
    // sem create/update no pai, a filha também não consulta
    const denied = await as('ana', 2).post('/company_fiscal/_lookups/sintegra', { value: '110042490114' });
    assert.equal(denied.status, 403, JSON.stringify(denied.body));
  });
}
