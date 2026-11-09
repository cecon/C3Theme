// Tela de entrada pela shell (spec/README.md#login-pela-shell): GET /_meta/login traz só o nome e o `auth` do
// app.json, para a shell montar o login antes de haver usuário. A autenticação em si é do sistema.

import assert from 'node:assert/strict';

export function loginTests({ test, as }) {
  test('login', '/_meta/login traz name e auth do app.json, e nada mais', async () => {
    const res = await as(null).get('/_meta/login');
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.deepEqual(Object.keys(res.body.data).sort(), ['auth', 'name']);
    assert.equal(res.body.data.name, 'CRM Exemplo');
    assert.equal(res.body.data.auth.identifier, 'username');
  });
}
