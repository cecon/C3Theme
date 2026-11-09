// Página registrada (spec/README.md, "Página registrada"): app.json pages[] com component, config e permission. O
// backend não desenha a página; só diz em GET /_meta/app quais páginas com permission o usuário pode abrir.
// No c3-example, `caio` não tem loja.balcao; os outros usuários têm.

import assert from 'node:assert/strict';

export function pagesTests({ test, as }) {
  test('meta', 'página registrada: config no app.json e permissão por usuário em /_meta/app', async () => {
    const admin = await as('admin').get('/_meta/app');
    assert.equal(admin.status, 200, JSON.stringify(admin.body));
    const balcao = admin.body.data.pages.find((p) => p.path === '/balcao');
    assert.equal(balcao.component, 'balcao');
    assert.deepEqual(balcao.config.columns, ['descricao', 'quantidade', 'total']);
    assert.deepEqual(admin.body.pages, { '/balcao': true }, 'só páginas com permission aparecem');
    const caio = await as('caio').get('/_meta/app');
    assert.deepEqual(caio.body.pages, { '/balcao': false });
    // filial guardada que não vale mais não derruba a carga do app: responde sem filial
    const stale = await as('admin', 999999).get('/_meta/app');
    assert.equal(stale.status, 200, JSON.stringify(stale.body));
    assert.deepEqual(stale.body.pages, { '/balcao': true });
  });
}
