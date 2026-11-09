// Arquivo como campo da entidade (`type: file`, escrita delegada): a escrita manda { name, contentType, data } e a
// leitura devolve só os metadados { name, size, contentType }. Sem a chave fica o gravado; null remove. Os bytes
// saem em GET /{entity}/{id}/_files/{campo}.

import assert from 'node:assert/strict';

const codes = (res, key) => (res.body?.error?.fields?.[key] ?? []).map((e) => e.code);
const b64 = (s) => Buffer.from(s).toString('base64');

export function fileFieldTests({ test, as, tag, nextNumber, raw }) {
  const branch1 = as(null, 1);
  const order = (extra) => branch1.post('/sales_order', { number: nextNumber(), description: `Anexo ${tag}`, ...extra });

  test('arquivo', 'campo da entidade: grava, lê só metadados, baixa os bytes, mantém sem a chave e remove com null', async () => {
    const pdf = { name: 'Pedido Assinado.pdf', contentType: 'application/pdf', data: b64('%PDF-1.4 conteúdo') };
    const created = await order({ attachment: pdf });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const id = created.body.data.id;
    const size = Buffer.byteLength('%PDF-1.4 conteúdo');
    assert.deepEqual(created.body.data.attachment, { name: 'Pedido Assinado.pdf', size, contentType: 'application/pdf' });

    const file = await raw(`/sales_order/${id}/_files/attachment`, { 'c3-branch': '1' });
    assert.equal(file.status, 200);
    assert.equal(file.headers.get('content-type'), 'application/pdf');
    assert.match(file.headers.get('content-disposition'), /filename\*=UTF-8''Pedido%20Assinado\.pdf/);
    assert.equal(Buffer.from(await file.arrayBuffer()).toString(), '%PDF-1.4 conteúdo');

    // sem a chave, e com os metadados de volta (a shell manda o formulário inteiro), o arquivo fica
    let res = await branch1.patch(`/sales_order/${id}`, { description: `Sem anexo novo ${tag}` });
    assert.equal(res.body.data.attachment.name, 'Pedido Assinado.pdf', JSON.stringify(res.body));
    res = await branch1.patch(`/sales_order/${id}`, { attachment: res.body.data.attachment });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.data.attachment.size, size);

    res = await branch1.patch(`/sales_order/${id}`, { attachment: null });
    assert.equal(res.body.data.attachment, null);
    assert.equal((await raw(`/sales_order/${id}/_files/attachment`, { 'c3-branch': '1' })).status, 404);
  });

  test('arquivo', 'campo da entidade: tamanho, extensão e metadados no lugar do arquivo novo → 422; ordenar → 400', async () => {
    const big = { name: 'a.pdf', data: Buffer.alloc(262145, 1).toString('base64') };
    assert.deepEqual(codes(await order({ attachment: big }), 'attachment'), ['too_large']);
    assert.deepEqual(codes(await order({ attachment: { name: 'a.exe', data: b64('x') } }), 'attachment'), ['file_type']);
    // na criação não há o que manter: metadados sem data não são arquivo
    assert.deepEqual(codes(await order({ attachment: { name: 'a.pdf', size: 3 } }), 'attachment'), ['invalid_type']);
    assert.equal((await branch1.get('/sales_order?sort=attachment')).status, 400);
    const plain = await order({});
    assert.equal((await raw(`/sales_order/${plain.body.data.id}/_files/description`, { 'c3-branch': '1' })).status, 404);
    // fora do escopo do usuário, o download some como o registro
    assert.equal((await raw(`/sales_order/${plain.body.data.id}/_files/attachment`, { authorization: 'Bearer beto' })).status, 404);
  });
}
