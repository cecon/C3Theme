// Arquivo no input de ação (`type: file`): trafega como { name, contentType, data } com data em base64. O motor
// confere forma, tamanho (maxSize) e extensão (accept); o sistema confere o conteúdo e guarda.

import assert from 'node:assert/strict';

const codes = (res, key) => (res.body?.error?.fields?.[key] ?? []).map((e) => e.code);
// "MI..." é o começo de uma SEQUENCE DER, como num .pfx; o resto é enchimento
const pfx = (bytes) => Buffer.concat([Buffer.from([0x30, 0x82]), Buffer.alloc(bytes - 2, 7)]).toString('base64');

export function fileTests({ test, call, tag }) {
  test('arquivo', 'ação recebe o arquivo em base64; tamanho, extensão e forma errados → 422 no campo', async () => {
    const created = await call('POST', '/company', { trade_name: `Certificado ${tag}` });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const act = (file, password = 'segredo') =>
      call('POST', `/company/${created.body.data.id}/_actions/replace_certificate`, { file, password });
    const ok = await act({ name: 'Emitente.PFX', contentType: 'application/x-pkcs12', data: pfx(2048) });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    assert.equal(ok.body.data.certificate, 'Emitente.PFX (2.0 KB)', 'o sistema recebeu nome e conteúdo');

    assert.deepEqual(codes(await act({ name: 'a1.pfx', data: pfx(65537) }), 'file'), ['too_large']);
    assert.deepEqual(codes(await act({ name: 'a1.zip', data: pfx(100) }), 'file'), ['file_type']);
    for (const bad of ['a1.pfx', { name: 'a1.pfx', data: 'não é base64' }, { name: 'a1.pfx', data: '' }, { data: pfx(10) }])
      assert.deepEqual(codes(await act(bad), 'file'), ['invalid_type'], JSON.stringify(bad));
    assert.deepEqual(codes(await act(null), 'file'), ['required']);
    // forma certa, conteúdo errado: quem recusa é a regra do sistema, no mesmo formato de erro
    assert.deepEqual(codes(await act({ name: 'a1.pfx', data: Buffer.from('texto').toString('base64') }), 'file'), ['invalid_certificate']);
  });
}
