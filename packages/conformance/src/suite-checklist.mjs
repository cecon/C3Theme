// Lista de marcar (`related` with_parent com display checklist): permissões do perfil. Cada opção marcada é
// uma linha da filha role_permission; a mesma opção duas vezes é 422 duplicate.

import assert from 'node:assert/strict';

const fieldCodes = (res, key) => (res.body?.error?.fields?.[key] ?? []).map((e) => e.code);

export function checklistTests({ test, call, tag }) {
  const marked = (res) => res.body.data.role_permission.map((r) => [r.permission_id.id, r.can_write]);

  test('checklist', 'marcar, desmarcar e a coluna da matriz passam pela lista do pai', async () => {
    const created = await call('POST', '/role', {
      name: `Caixa ${tag}`,
      role_permission: [{ permission_id: '1' }, { permission_id: '4', can_write: true }]
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.deepEqual(marked(created), [
      ['1', false],
      ['4', true]
    ]);
    const [first] = created.body.data.role_permission;
    // desmarca a 4, marca a 5 e muda a 1 para alterar
    const res = await call('PATCH', `/role/${created.body.data.id}`, {
      role_permission: [{ id: first.id, permission_id: '1', can_write: true }, { permission_id: '5' }]
    });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.deepEqual(marked(res), [
      ['1', true],
      ['5', false]
    ]);
  });

  test('checklist', 'a mesma opção duas vezes → 422 duplicate na linha repetida', async () => {
    const res = await call('POST', '/role', {
      name: `Repetido ${tag}`,
      role_permission: [{ permission_id: '2' }, { permission_id: '2', can_write: true }]
    });
    assert.equal(res.status, 422);
    assert.deepEqual(fieldCodes(res, 'role_permission.1.permission_id'), ['duplicate']);
    assert.deepEqual(fieldCodes(res, 'role_permission.0.permission_id'), []);
  });
}
