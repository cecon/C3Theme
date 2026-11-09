// Testes caixa-preta do contrato C3 (spec/v0/openapi.yaml + spec/README.md).
//
// Rodam contra um backend que serve o CRM de exemplo (spec/v0/examples): é o alvo de
// referência de toda implementação do contrato (c3-engine em Rust, futuro adapter Node).
// Cada execução cria dados com uma etiqueta única e filtra por ela, então pode rodar
// repetidas vezes no mesmo banco.

import assert from 'node:assert/strict';
import { featureTests } from './features.mjs';
import { actionTests } from './suite-actions.mjs';
import { crudTests } from './suite-crud.mjs';
import { listTests } from './suite-list.mjs';
import { scopeTests } from './suite-scope.mjs';
import { versionTests } from './suite-version.mjs';

export function buildSuite(baseUrl) {
  const base = baseUrl.replace(/\/$/, '');
  const tag = `cf${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const state = { types: null, companies: [], customers: [] };

  async function call(method, path, body, headers = {}) {
    const res = await fetch(base + path, {
      method,
      headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...headers },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body)
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      /* corpo não-JSON fica null e o teste reclama */
    }
    // text e headers: resposta que é arquivo (ação `returns: "file"`)
    return { status: res.status, body: json, text, headers: res.headers };
  }
  const list = (entity, params) => call('GET', `/${entity}?${new URLSearchParams(params)}`);
  const mine = (where) =>
    where ? { and: [{ field: 'name', op: 'contains', value: tag }, where] } : { field: 'name', op: 'contains', value: tag };

  async function newCompany(name) {
    const res = await call('POST', '/company', { trade_name: `${name} ${tag}` });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    state.companies.push(res.body.data);
    return res.body.data;
  }

  async function newCustomer(fields) {
    const res = await call('POST', '/customer', { status: 'lead', ...fields, name: `${fields.name ?? 'Cliente'} ${tag}` });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    state.customers.push(res.body.data);
    return res.body.data;
  }

  const tests = [];
  const test = (group, name, fn) => tests.push({ group, name, fn });

  //
  // Dados fixos do CRM de exemplo (spec/v0/conformance/README.md): empresas 1 (Alfa) e 2 (Beta);
  // filiais 1 e 2 da Alfa, 3 da Beta. Usuários: sem Authorization vê tudo; "ana" vê as filiais 1
  // (tudo) e 2 (só leitura, e nada de vendedores); "beto" só a 3.

  const as = (user, branch) => {
    const headers = { ...(user && { authorization: `Bearer ${user}` }), ...(branch && { 'c3-branch': String(branch) }) };
    return {
      get: (path) => call('GET', path, undefined, headers),
      list: (entity, params) => call('GET', `/${entity}?${new URLSearchParams(params)}`, undefined, headers),
      post: (path, body) => call('POST', path, body, headers),
      patch: (path, body) => call('PATCH', path, body, headers),
      del: (path, extra = {}) => call('DELETE', path, undefined, { ...headers, ...extra })
    };
  };
  let seq = (Date.now() % 1e8) * 10;
  const nextNumber = () => ++seq;
  const ids = (res) => res.body.data.map((r) => r.id).sort();

  async function newOrder(user, branch, fields = {}) {
    const res = await as(user, branch).post('/sales_order', { number: nextNumber(), description: `Pedido ${tag}`, ...fields });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return res.body.data;
  }
  async function newSeller(user, branch) {
    const res = await as(user, branch).post('/seller', { name: `Vendedor ${tag}` });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return res.body.data;
  }
  const mineOrders = { field: 'description', op: 'contains', value: tag };

  const ctx = { test, call, list, mine, newCompany, newCustomer, state, tag, as, nextNumber, ids, newOrder, newSeller, mineOrders };
  crudTests(ctx);
  listTests(ctx);
  scopeTests(ctx);
  actionTests(ctx);
  versionTests(ctx);
  featureTests({ test, call, as, tag, nextNumber, newOrder, raw: (path, headers) => fetch(base + path, { headers }), base });
  return { tests, tag };
}
