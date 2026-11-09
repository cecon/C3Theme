// CPF e CNPJ (`format` em string; casos de validação em spec/v0/conformance/documents.json): aqui só o que
// passa pela API, no CNPJ da empresa do CRM de exemplo.

import assert from 'node:assert/strict';

const fieldCode = (res, field) => res.body?.error?.fields?.[field]?.[0]?.code;

/** CNPJ alfanumérico válido e único por rodada: 12 caracteres da etiqueta + os dígitos verificadores. */
function cnpjFrom(tag) {
  const base = tag
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .padEnd(12, '0')
    .slice(0, 12);
  const values = [...base].map((c) => c.charCodeAt(0) - 48);
  const dv = (vals) => {
    let sum = 0;
    for (let i = vals.length - 1, w = 2; i >= 0; i--, w = w === 9 ? 2 : w + 1) sum += vals[i] * w;
    return sum % 11 < 2 ? 0 : 11 - (sum % 11);
  };
  const d1 = dv(values);
  return `${base}${d1}${dv([...values, d1])}`;
}

export function documentTests({ test, call, tag }) {
  test('documento', 'CNPJ alfanumérico grava e filtra sem máscara; DV errado, máscara e minúscula → 422', async () => {
    const cnpj = cnpjFrom(tag);
    const post = (value) => call('POST', '/company', { trade_name: `Doc ${tag}`, cnpj: value });
    const created = await post(cnpj);
    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.equal(created.body.data.cnpj, cnpj, 'trafega como foi gravado, sem máscara');
    const where = JSON.stringify({ field: 'cnpj', op: 'eq', value: cnpj });
    assert.equal((await call('GET', `/company?${new URLSearchParams({ where })}`)).body.meta.total, 1);

    const wrongDigit = cnpj.slice(0, 13) + String((Number(cnpj[13]) + 1) % 10);
    assert.equal(fieldCode(await post(wrongDigit), 'cnpj'), 'check_digit');
    const masked = `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
    assert.equal(fieldCode(await post(masked), 'cnpj'), 'pattern');
    if (/[A-Z]/.test(cnpj)) assert.equal(fieldCode(await post(cnpj.toLowerCase()), 'cnpj'), 'pattern');
    assert.equal(fieldCode(await post('52998224725'), 'cnpj'), 'pattern', 'CPF num campo só de CNPJ');
  });
}
