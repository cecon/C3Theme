// Quadro e calendário (spec/README.md#quadro-e-calendário) não têm endpoint próprio: a shell lê cada coluna e cada
// mês com o GET da lista e move o cartão com PATCH. Aqui fica o que eles exigem do contrato, com activity.

import assert from 'node:assert/strict';

export function viewsTests({ test, as, tag }) {
  const api = () => as(null, 1);
  const post = (body) => api().post('/activity', { subject: `Quadro ${tag}`, ...body });
  const ids = async (where) => {
    const res = await api().list('activity', {
      where: JSON.stringify({ and: [{ field: 'subject', op: 'eq', value: `Quadro ${tag}` }, where] }),
      sort: 'due_date'
    });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    return res.body.data.map((r) => r.id);
  };

  test('views', 'coluna do quadro: where por valor do enum somado ao filtro do preset', async () => {
    const a = await post({ stage: 'todo', due_date: '2026-10-05' });
    const b = await post({ stage: 'doing', due_date: '2026-10-06' });
    assert.equal(a.status, 201, JSON.stringify(a.body));
    assert.equal(b.status, 201, JSON.stringify(b.body));
    const pending = { field: 'stage', op: 'in', value: ['todo', 'doing'] };
    assert.deepEqual(await ids({ and: [pending, { field: 'stage', op: 'eq', value: 'todo' }] }), [a.body.data.id]);
    assert.deepEqual(await ids({ and: [pending, { field: 'stage', op: 'eq', value: 'done' }] }), []);
  });

  test('views', 'arrastar o cartão grava o campo do agrupamento com PATCH e ele muda de coluna', async () => {
    const a = await post({ stage: 'todo', due_date: '2026-10-07' });
    const moved = await api().patch(`/activity/${a.body.data.id}`, { stage: 'done' });
    assert.equal(moved.status, 200, JSON.stringify(moved.body));
    assert.equal(moved.body.data.stage, 'done');
    assert.ok((await ids({ field: 'stage', op: 'eq', value: 'done' })).includes(a.body.data.id));
    assert.ok(!(await ids({ field: 'stage', op: 'eq', value: 'todo' })).includes(a.body.data.id));
  });

  test('views', 'mês do calendário: gte no primeiro dia da grade e lt no dia seguinte ao último', async () => {
    const inside = await post({ stage: 'todo', due_date: '2026-11-08' });
    const edge = await post({ stage: 'todo', due_date: '2026-11-09' });
    const range = {
      and: [
        { field: 'due_date', op: 'gte', value: '2026-10-26' },
        { field: 'due_date', op: 'lt', value: '2026-11-09' }
      ]
    };
    const found = await ids(range);
    assert.ok(found.includes(inside.body.data.id), 'dia dentro do período');
    assert.ok(!found.includes(edge.body.data.id), 'o limite de cima não entra');
  });
}
