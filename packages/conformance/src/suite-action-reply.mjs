// Arquivo e registro aberto pela ação (spec/README.md, "Arquivo e registro aberto pela ação"). product.scale_file
// é ação da lista `returns: "file"` (TXT da balança, aviso em C3-Message); product.scale_app responde só o endereço
// (`link`); product.duplicate cria a cópia e responde `open`.

import assert from 'node:assert/strict';

export function actionReplyTests({ test, call, tag }) {
  const product = async (name, price, active = true) => {
    const res = await call('POST', '/product', { name: `${name} ${tag}`, product_group: 'drinks', price, active });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return res.body.data;
  };

  test('ações', 'ação returns file: o corpo é o arquivo, com nome no Content-Disposition e aviso em C3-Message', async () => {
    const off = await product('Refri parado', '3.00', false);
    const res = await call('POST', '/product/_actions/scale_file', { input: { only_active: false } });
    assert.equal(res.status, 200, res.text);
    assert.match(res.headers.get('content-type'), /^text\/plain/);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.match(res.headers.get('content-disposition'), /^attachment; filename\*=UTF-8''balan%C3%A7a\.txt$/);
    assert.match(decodeURIComponent(res.headers.get('c3-message')), /^\d+ produto\(s\) no arquivo da balança\.$/);
    assert.ok(res.text.includes(`${off.id.padStart(6, '0')};${off.name};300`), 'linha do inativo no arquivo');
    // só os ativos: o inativo some
    const active = await call('POST', '/product/_actions/scale_file', { input: {} });
    assert.ok(!active.text.includes(off.name));
  });

  test('ações', 'ação com open: a resposta diz qual registro a shell abre', async () => {
    const original = await product('Suco duplicado', '8.00');
    const res = await call('POST', `/product/${original.id}/_actions/duplicate`, {});
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.message, 'Cópia criada.');
    assert.equal(res.body.open.entity, 'product');
    assert.notEqual(res.body.open.id, original.id);
    const copy = await call('GET', `/product/${res.body.open.id}`);
    assert.equal(copy.body.data.name, `Cópia de ${original.name}`);
    assert.equal(copy.body.data.active, false);
  });

  test('ações', 'ação com link: a resposta traz só o endereço, sem o arquivo', async () => {
    const res = await call('POST', '/product/_actions/scale_app', { input: {} });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.match(res.body.link, /^https:\/\//);
    assert.equal(res.body.message, 'Baixando o programa da balança.');
    assert.equal(res.body.open, undefined);
  });
}
