// Layout do formulário (spec/README.md, "Abas no formulário" e "Seção condicional"): o backend serve as seções
// como estão no JSON da entidade, com `tab` e `visibleWhen`, e trata o que a seção escondida mostra como escondido.

import assert from 'node:assert/strict';

const fieldCodes = (res, key) => (res.body?.error?.fields?.[key] ?? []).map((e) => e.code);

export function formTests({ test, call, tag }) {
  test('meta', 'views.form.sections chega com `tab`: sem aba primeiro, depois as abas, inclusive em related', async () => {
    const tabsOf = async (e) => (await call('GET', `/_meta/entities/${e}`)).body.data.views.form.sections.map((s) => s.tab ?? null);
    assert.deepEqual(await tabsOf('customer'), [null, 'Financeiro', 'Observações']);
    assert.deepEqual(
      await tabsOf('company'),
      [null, 'Contatos', 'Fiscal', 'Fornecedor', 'Clientes'],
      'related with_parent e separately também têm aba'
    );
  });

  test('form', 'seção escondida (visibleWhen): campos não são validados e gravam null; aparecendo, valem', async () => {
    const base = { trade_name: `Seção ${tag}` };
    const hidden = await call('POST', '/company', { ...base, is_supplier: false, supplier_terms: 30 });
    assert.equal(hidden.status, 201, JSON.stringify(hidden.body));
    assert.equal(hidden.body.data.supplier_terms, null, 'campo de seção escondida grava null');
    const missing = await call('PATCH', `/company/${hidden.body.data.id}`, { is_supplier: true });
    assert.equal(missing.status, 422);
    assert.deepEqual(fieldCodes(missing, 'supplier_terms'), ['required'], 'com a seção visível, o obrigatório vale');
    const ok = await call('PATCH', `/company/${hidden.body.data.id}`, { is_supplier: true, supplier_terms: 28 });
    assert.equal(ok.body.data.supplier_terms, 28);
  });

  test('form', 'related with_parent em seção escondida vale lista vazia: exclui o gravado mesmo sem a lista no corpo', async () => {
    const fiscal = [{ tax_regime: 'simples' }];
    const res = await call('POST', '/company', { trade_name: `Fiscal oculto ${tag}`, taxpayer: false, company_fiscal: fiscal });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.deepEqual(res.body.data.company_fiscal, [], 'escondida na criação: nada gravado');
    const id = res.body.data.id;
    const shown = await call('PATCH', `/company/${id}`, { taxpayer: true, company_fiscal: fiscal });
    assert.equal(shown.body.data.company_fiscal.length, 1);
    const off = await call('PATCH', `/company/${id}`, { taxpayer: false });
    assert.equal(off.status, 200, JSON.stringify(off.body));
    assert.deepEqual(off.body.data.company_fiscal, [], 'desmarcar exclui a linha');
  });
}
