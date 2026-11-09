// Conjunto de opções gravado como inteiro (`type: flags`, spec/README.md#tipos-de-campo-e-formato-trafegado):
// dias de trabalho do vendedor, um bit por dia (Dom = 1 ... Sáb = 64).

import assert from 'node:assert/strict';

const fieldCode = (res, field) => res.body?.error?.fields?.[field]?.[0]?.code;

export function flagsTests({ test, as, tag }) {
  const post = (body) => as(null, 1).post('/seller', { name: `Flags ${tag}`, ...body });

  test('flags', 'grava e lê o inteiro; default; filtra por eq e in', async () => {
    const weekdays = await post({ work_days: 62 });
    assert.equal(weekdays.status, 201, JSON.stringify(weekdays.body));
    assert.equal(weekdays.body.data.work_days, 62);
    assert.equal((await post({})).body.data.work_days, 62, 'default do campo');
    const weekend = await post({ work_days: 1 | 64 });
    assert.equal(weekend.body.data.work_days, 65);
    const none = await post({ work_days: 0 });
    assert.equal(none.body.data.work_days, 0, '0 = nenhum marcado, não é vazio');

    const where = JSON.stringify({
      and: [
        { field: 'name', op: 'eq', value: `Flags ${tag}` },
        { field: 'work_days', op: 'in', value: [65, 0] }
      ]
    });
    const res = await as(null, 1).list('seller', { where });
    assert.deepEqual(res.body.data.map((r) => r.id).sort(), [weekend.body.data.id, none.body.data.id].sort());
  });

  test('flags', 'bit fora das opções → invalid_option; texto, negativo ou fração → invalid_type', async () => {
    assert.equal(fieldCode(await post({ work_days: 128 }), 'work_days'), 'invalid_option');
    for (const v of ['62', -1, 2.5, true])
      assert.equal(fieldCode(await post({ work_days: v }), 'work_days'), 'invalid_type', JSON.stringify(v));
  });
}
