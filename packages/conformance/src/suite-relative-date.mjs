// Datas relativas em filtros (spec/README.md#condições): `{"$date": ...}` e `{"$now": true}` no `where` da lista e
// do `_aggregate` viram datas pelo relógio do sistema. O c3-example usa o padrão (UTC).

import assert from 'node:assert/strict';

const DAY = 86_400_000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

export function relativeDateTests({ test, as, call, tag }) {
  const api = as(null, 1);
  const subject = `Relativa ${tag}`;
  const q = (where) => new URLSearchParams({ where: JSON.stringify(where), pageSize: '100' });
  const mine = (...leaves) => ({ and: [{ field: 'subject', op: 'eq', value: subject }, ...leaves] });

  test('datas relativas', '$date today/offset em date, na lista e no _aggregate', async () => {
    const now = Date.now();
    for (const due_date of [iso(now), iso(now - 3 * DAY), iso(now - 40 * DAY), iso(now + 10 * DAY)]) {
      const res = await api.post('/activity', { subject, stage: 'todo', due_date });
      assert.equal(res.status, 201, JSON.stringify(res.body));
    }
    const lastWeek = mine(
      { field: 'due_date', op: 'gte', value: { $date: 'today', offset: -7 } },
      { field: 'due_date', op: 'lte', value: { $date: 'today' } }
    );
    const list = await api.get(`/activity?${q(lastWeek)}`);
    assert.equal(list.status, 200, JSON.stringify(list.body));
    assert.deepEqual(list.body.data.map((r) => r.due_date).sort(), [iso(now - 3 * DAY), iso(now)]);
    const late = await api.get(`/activity?${q(mine({ field: 'due_date', op: 'lt', value: { $date: 'today' } }))}`);
    assert.equal(late.body.meta.total, 2);
    const agg = await api.get(`/activity/_aggregate?${q(lastWeek)}`);
    assert.deepEqual(agg.body.data, [{ key: null, value: 2 }]);
    const year = mine({ field: 'due_date', op: 'gte', value: { $date: 'yearStart', offset: -1, unit: 'year' } });
    assert.equal((await api.get(`/activity?${q(year)}`)).body.meta.total, 4);
  });

  test('datas relativas', '$now em datetime; valor relativo inválido é 400', async () => {
    const created = await call('POST', '/customer', { status: 'lead', name: `Relativa ${tag}` });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const c = created.body.data;
    const recent = {
      and: [
        { field: 'id', op: 'eq', value: c.id },
        { field: 'created_at', op: 'gte', value: { $now: true, offset: -1, unit: 'hour' } }
      ]
    };
    const res = await call('GET', `/customer?${q(recent)}`);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.meta.total, 1);
    const future = { and: [recent.and[0], { field: 'created_at', op: 'gte', value: { $now: true, offset: 1, unit: 'hour' } }] };
    assert.equal((await call('GET', `/customer?${q(future)}`)).body.meta.total, 0);
    for (const bad of [
      { field: 'subject', op: 'eq', value: { $date: 'today' } },
      { field: 'due_date', op: 'in', value: { $date: 'today' } },
      { field: 'due_date', op: 'eq', value: { $now: true } },
      { field: 'due_date', op: 'eq', value: { $date: 'ontem' } },
      { field: 'due_date', op: 'eq', value: { $date: 'today', unit: 'hour' } }
    ]) {
      assert.equal((await api.get(`/activity?${q(bad)}`)).status, 400, JSON.stringify(bad));
    }
  });
}
