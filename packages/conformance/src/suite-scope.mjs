// Escopo por empresa e filial: contexto, criação na filial ativa, leitura, lista, reference e unique.

import assert from 'node:assert/strict';
import { assertError, assertFieldError } from './assertions.mjs';

export function scopeTests({ test, tag, as, nextNumber, ids, newOrder, newSeller, mineOrders }) {
  test('escopo', 'GET /_meta/context: filiais permitidas, padrão e filial ativa conferida', async () => {
    const res = await as('ana').get('/_meta/context');
    assert.equal(res.status, 200, JSON.stringify(res.body));
    const ctx = res.body.data;
    assert.deepEqual(ctx.organization, { company: 'org_company', branch: 'branch' });
    assert.deepEqual(
      ctx.branches.map((b) => [b.id, b.company]),
      [
        ['2', '1'],
        ['1', '1']
      ],
      'filiais da ana, ordenadas por empresa e título (Alfa Centro antes de Alfa Matriz)'
    );
    assert.deepEqual(
      ctx.companies.map((c) => c.id),
      ['1']
    );
    assert.equal(ctx.defaultBranch, '1');
    assert.equal(ctx.activeBranch, null);
    assert.equal((await as('ana', 2).get('/_meta/context')).body.data.activeBranch, '2');
    assertError(await as('ana', 3).get('/_meta/context'), 403, 'forbidden');
    assertError(await as('ana', 'x').get('/_meta/context'), 400, 'bad_request');
  });

  test('escopo', 'capabilities em /_meta/entities dependem da filial ativa', async () => {
    assert.equal((await as('ana', 1).get('/_meta/entities/sales_order')).body.capabilities.create, true);
    assert.equal((await as('ana', 2).get('/_meta/entities/sales_order')).body.capabilities.create, false);
  });

  test('escopo', 'criar grava na filial ativa; sem ela → 400; filial só leitura → 403; chave reservada no corpo → 400', async () => {
    const o = await newOrder('ana', 1);
    assert.deepEqual(o._branch, { id: '1', title: 'Alfa Matriz' });
    assert.deepEqual(o._company, { id: '1', title: 'Alfa Combustíveis' });
    assert.deepEqual(o._can, { update: true, delete: true });
    assertError(await as('ana').post('/sales_order', { number: nextNumber(), description: `x ${tag}` }), 400, 'bad_request');
    assertError(await as('ana', 2).post('/sales_order', { number: nextNumber(), description: `x ${tag}` }), 403, 'forbidden');
    assertError(
      await as('ana', 1).post('/sales_order', { number: nextNumber(), description: `x ${tag}`, _branch: '3' }),
      400,
      'bad_request'
    );
    assertError(await as('ana', 1).patch(`/sales_order/${o.id}`, { _branch: { id: '3', title: 'Beta Loja 1' } }), 400, 'bad_request');
  });

  test('escopo', 'registro de outra filial: ler, alterar e excluir pelo id → 404', async () => {
    const theirs = await newOrder('beto', 3);
    assertError(await as('ana', 1).get(`/sales_order/${theirs.id}`), 404, 'not_found');
    assertError(await as('ana', 1).patch(`/sales_order/${theirs.id}`, { description: `invadido ${tag}` }), 404, 'not_found');
    assertError(await as('ana', 1).del(`/sales_order/${theirs.id}`), 404, 'not_found');
    const still = await as('beto', 3).get(`/sales_order/${theirs.id}`);
    assert.equal(still.status, 200);
    assert.equal(still.body.data.description, `Pedido ${tag}`, 'nada mudou');
  });

  test('escopo', 'lista e contagem só com as filiais pedidas e permitidas', async () => {
    const a1 = await newOrder('ana', 1);
    const a2 = await newOrder(null, 2);
    const b3 = await newOrder('beto', 3);
    const where = JSON.stringify(mineOrders);
    const ana = await as('ana').list('sales_order', { where, pageSize: 100 });
    assert.equal(ana.status, 200, JSON.stringify(ana.body));
    assert.ok(!ids(ana).includes(b3.id), 'ana não vê pedido da Beta');
    assert.ok(ids(ana).includes(a1.id) && ids(ana).includes(a2.id), 'sem filial ativa: todas as permitidas');
    assert.equal(ana.body.meta.total, ana.body.data.length, 'o total conta só o que ela enxerga');
    const only1 = await as('ana', 1).list('sales_order', { where, pageSize: 100 });
    assert.ok(
      only1.body.data.every((r) => r._branch.id === '1'),
      'padrão: só a filial ativa'
    );
    const both = await as('ana', 1).list('sales_order', { where, pageSize: 100, branches: '1,2' });
    assert.deepEqual([...new Set(both.body.data.map((r) => r._branch.id))].sort(), ['1', '2']);
    assertError(await as('ana', 1).list('sales_order', { branches: '1,3' }), 403, 'forbidden');
    const all = await as(null).list('sales_order', { where, pageSize: 100 });
    assert.ok(ids(all).includes(b3.id), 'quem vê tudo vê a Beta');
  });

  test('escopo', 'filial só leitura: _can falso e alterar/excluir → 403', async () => {
    const o = await newOrder(null, 2);
    const seen = await as('ana', 2).get(`/sales_order/${o.id}`);
    assert.equal(seen.status, 200);
    assert.deepEqual(seen.body.data._can, { update: false, delete: false });
    assertError(await as('ana', 1).patch(`/sales_order/${o.id}`, { description: `x ${tag}` }), 403, 'forbidden');
    assertError(await as('ana', 1).del(`/sales_order/${o.id}`), 403, 'forbidden');
  });

  test('escopo', 'reference: fora do que o usuário vê → not_found; de outra filial → out_of_scope', async () => {
    const betoSeller = await newSeller('beto', 3);
    assertFieldError(
      await as('ana', 1).post('/sales_order', { number: nextNumber(), description: `x ${tag}`, seller_id: betoSeller.id }),
      'seller_id',
      'not_found'
    );
    // quem enxerga as duas filiais ainda não pode misturar
    assertFieldError(
      await as(null, 1).post('/sales_order', { number: nextNumber(), description: `x ${tag}`, seller_id: betoSeller.id }),
      'seller_id',
      'out_of_scope'
    );
    const o = await newOrder(null, 1);
    assertFieldError(await as(null, 1).patch(`/sales_order/${o.id}`, { seller_id: betoSeller.id }), 'seller_id', 'out_of_scope');
    const mineSeller = await newSeller('ana', 1);
    const ok = await newOrder('ana', 1, { seller_id: mineSeller.id });
    assert.deepEqual(ok.seller_id, { id: mineSeller.id, title: `Vendedor ${tag}` });
  });

  test('escopo', 'título de reference que o usuário não pode ler vem null', async () => {
    const seller = await newSeller(null, 2);
    const o = await newOrder(null, 2, { seller_id: seller.id });
    const seen = await as('ana', 2).get(`/sales_order/${o.id}`);
    assert.equal(seen.status, 200);
    assert.deepEqual(seen.body.data.seller_id, { id: seller.id, title: null }, 'ana não lê vendedores da filial 2');
    assertError(await as('ana', 2).get(`/seller/${seller.id}`), 404, 'not_found');
  });

  test('escopo', 'unique vale dentro da filial', async () => {
    const n = nextNumber();
    await newOrder(null, 1, { number: n });
    assertFieldError(await as(null, 1).post('/sales_order', { number: n, description: `x ${tag}` }), 'number', 'unique', 409);
    await newOrder(null, 3, { number: n });
  });

  test('escopo', "scope 'company': filiais da própria empresa", async () => {
    const beto = await as('beto').list('branch', {});
    assert.deepEqual(ids(beto), ['3']);
    const ana = await as('ana').list('branch', {});
    assert.deepEqual(ids(ana), ['1', '2']);
    assert.deepEqual(ana.body.data[0]._company, { id: '1', title: 'Alfa Combustíveis' });
    assertError(await as('beto').get('/branch/1'), 404, 'not_found');
  });
}
