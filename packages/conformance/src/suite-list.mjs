// Lista: paginação, ordenação, busca livre (q) e filtro (where) igual ao avaliador de referência.

import assert from 'node:assert/strict';
import { evaluate } from '../../engine/src/conditions.mjs';
import { assertError } from './assertions.mjs';

export function listTests({ test, list, mine, newCustomer, state, tag }) {
  // ---------------- listagem ----------------

  test('lista', 'paginação e meta', async () => {
    const before = (await list('customer', { where: JSON.stringify(mine()) })).body.meta.total;
    for (let i = 0; i < 12 - before; i++) await newCustomer({ name: `Pag ${String(i).padStart(2, '0')}` });
    const p1 = await list('customer', { where: JSON.stringify(mine()), pageSize: 10 });
    assert.equal(p1.status, 200);
    assert.deepEqual(p1.body.meta, { page: 1, pageSize: 10, total: Math.max(12, before) });
    assert.equal(p1.body.data.length, 10);
    const p2 = await list('customer', { where: JSON.stringify(mine()), pageSize: 10, page: 2 });
    assert.equal(p2.body.data.length, Math.max(12, before) - 10);
    const ids = new Set([...p1.body.data, ...p2.body.data].map((r) => r.id));
    assert.equal(ids.size, Math.max(12, before), 'páginas sem repetição');
    assert.equal((await list('customer', { pageSize: 25 })).body.meta.pageSize, 25);
    assertError(await list('customer', { pageSize: 7 }), 400, 'bad_request');
    assertError(await list('customer', { page: 0 }), 400, 'bad_request');
  });

  test('lista', 'sort: asc/desc, desempate por id, vazios por último', async () => {
    await newCustomer({ name: 'Zeta', birth_date: '1980-01-01' });
    await newCustomer({ name: 'Alfa', birth_date: '2001-01-01' });
    const all = async (sort) => {
      const res = await list('customer', { where: JSON.stringify(mine()), sort, pageSize: 100 });
      assert.equal(res.status, 200, JSON.stringify(res.body));
      return res.body.data;
    };
    const byName = await all('name');
    const names = byName.map((r) => r.name);
    assert.deepEqual(
      names,
      [...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
      'ordem por name'
    );
    for (const sort of ['birth_date', '-birth_date']) {
      const rows = await all(sort);
      const firstNull = rows.findIndex((r) => r.birth_date === null);
      assert.ok(firstNull > 0, 'há datas e vazios');
      assert.ok(
        rows.slice(firstNull).every((r) => r.birth_date === null),
        `${sort}: vazios por último`
      );
      const dates = rows.slice(0, firstNull).map((r) => r.birth_date);
      const sorted = [...dates].sort();
      assert.deepEqual(dates, sort.startsWith('-') ? sorted.reverse() : sorted);
      const nullIds = rows.slice(firstNull).map((r) => Number(r.id));
      assert.deepEqual(
        nullIds,
        [...nullIds].sort((a, b) => a - b),
        'desempate por id'
      );
    }
    assertError(await list('customer', { sort: 'inventado' }), 400, 'bad_request');
  });

  test('lista', 'q: busca sem diferenciar maiúsculas, inclusive acentuadas', async () => {
    const c = await newCustomer({ name: 'ÉRICA' });
    const res = await list('customer', { q: `érica ${tag}`, pageSize: 100 });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.ok(
      res.body.data.some((r) => r.id === c.id),
      'q "érica" acha "ÉRICA"'
    );
    const none = await list('customer', { q: `erica ${tag}`, pageSize: 100 });
    assert.ok(!none.body.data.some((r) => r.id === c.id), 'acento continua diferenciando');
    const special = await list('customer', { q: `.*${tag}`, pageSize: 100 });
    assert.equal(special.body.meta.total, 0, 'q é texto literal, não regex');
  });

  test('lista', 'where: resultado igual ao avaliador de referência', async () => {
    const acme = state.companies[0];
    await newCustomer({ name: 'Vip sem empresa', vip: true, credit_limit: '50000.00' });
    await newCustomer({ name: 'Vip com empresa', vip: true, company_id: acme.id, status: 'active', credit_limit: '9.00' });
    await newCustomer({ name: 'Vazio', notes: '' });
    const rows = (await list('customer', { where: JSON.stringify(mine()), pageSize: 100 })).body.data;
    const cases = [
      { field: 'status', op: 'eq', value: 'active' },
      { field: 'status', op: 'ne', value: 'lead' },
      { field: 'status', op: 'in', value: ['active', 'churned'] },
      { field: 'vip', op: 'eq', value: true },
      { field: 'vip', op: 'ne', value: true },
      { field: 'company_id', op: 'null', value: true },
      { field: 'company_id', op: 'eq', value: acme.id },
      { field: 'company_id', op: 'ne', value: acme.id },
      { field: 'credit_limit', op: 'gt', value: '10.00' },
      { field: 'credit_limit', op: 'lte', value: '9' },
      { field: 'credit_limit', op: 'ne', value: '1234.50' },
      { field: 'birth_date', op: 'lt', value: '2000-01-01' },
      { field: 'birth_date', op: 'null', value: false },
      { field: 'notes', op: 'null', value: true },
      { field: 'email', op: 'contains', value: 'MARIA' },
      { field: 'name', op: 'contains', value: 'érica' },
      { not: { field: 'status', op: 'eq', value: 'lead' } },
      {
        or: [
          { field: 'vip', op: 'eq', value: true },
          { field: 'status', op: 'eq', value: 'churned' }
        ]
      },
      {
        and: [
          { field: 'vip', op: 'eq', value: true },
          { field: 'company_id', op: 'null', value: true }
        ]
      },
      {
        not: {
          or: [
            { field: 'credit_limit', op: 'null', value: true },
            { field: 'credit_limit', op: 'lt', value: '100' }
          ]
        }
      }
    ];
    for (const where of cases) {
      const expected = rows
        .filter((r) => evaluate(where, r, state.types))
        .map((r) => r.id)
        .sort();
      const res = await list('customer', { where: JSON.stringify(mine(where)), pageSize: 100 });
      assert.equal(res.status, 200, `${JSON.stringify(where)} → ${JSON.stringify(res.body)}`);
      const got = res.body.data.map((r) => r.id).sort();
      assert.deepEqual(got, expected, `where ${JSON.stringify(where)}`);
      assert.equal(res.body.meta.total, expected.length);
    }
  });

  test('lista', 'where inválido → 400', async () => {
    for (const where of [
      '{quebrado',
      JSON.stringify({ field: 'vip', op: 'gt', value: true }),
      JSON.stringify({ field: 'inventado', op: 'eq', value: 'x' }),
      JSON.stringify({ field: 'status', op: 'eq', value: 'xyz' }),
      JSON.stringify({ field: 'created_at', op: 'gt', value: '2026-10-17T02:55:16.123Z' }),
      JSON.stringify({ and: [] })
    ])
      assertError(await list('customer', { where }), 400, 'bad_request');
  });
}
