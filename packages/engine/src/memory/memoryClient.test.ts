import { describe, expect, it } from 'vitest';

import { ApiError } from '../api';
import type { AppDef, EntityDef } from '../types';
import { createMemoryClient } from './memoryClient';

const app: AppDef = { name: 'teste', entities: ['pedido'], layout: { menu: [] } };
const cliente: EntityDef = {
  name: 'cliente',
  label: { singular: 'Cliente', plural: 'Clientes' },
  titleField: 'nome',
  fields: [{ name: 'nome', type: 'string', required: true }]
};
const pedido: EntityDef = {
  name: 'pedido',
  label: { singular: 'Pedido', plural: 'Pedidos' },
  fields: [
    { name: 'numero', type: 'integer', required: true },
    { name: 'cliente', type: 'reference', entity: 'cliente' },
    { name: 'total', type: 'decimal', scale: 2 },
    { name: 'data', type: 'date' },
    {
      name: 'situacao',
      type: 'enum',
      default: 'aberto',
      options: [
        { value: 'aberto', label: 'Aberto' },
        { value: 'pago', label: 'Pago' }
      ]
    }
  ],
  views: {
    list: { search: ['cliente'], defaultSort: [{ field: 'numero', direction: 'desc' }] },
    form: { sections: [{ rows: [['numero']] }, { related: { entity: 'item', field: 'pedido', save: 'with_parent' } }] }
  }
};
const item: EntityDef = {
  name: 'item',
  label: { singular: 'Item', plural: 'Itens' },
  fields: [
    { name: 'pedido', type: 'reference', entity: 'pedido' },
    { name: 'produto', type: 'string', required: true }
  ]
};

const seed = () =>
  createMemoryClient({
    app,
    entities: [cliente, pedido, item],
    now: () => new Date(2026, 10, 5),
    actions: {
      pedido: {
        pagar: (r) => {
          if (r.situacao === 'pago') throw new ApiError(409, 'conflict', 'Já está pago.');
          return { situacao: 'pago' };
        }
      }
    },
    records: {
      cliente: [
        { id: 'c1', nome: 'Ana' },
        { id: 'c2', nome: 'Bruno' }
      ],
      pedido: [
        { id: 'p1', numero: 1, cliente: 'c1', total: '10.50', data: '2026-10-20', situacao: 'pago' },
        { id: 'p2', numero: 2, cliente: 'c2', total: '5.00', data: '2026-11-02' },
        { id: 'p3', numero: 3, cliente: { id: 'c1', title: 'Ana' }, total: '1.25', data: '2026-11-04' }
      ],
      item: [{ id: 'i1', pedido: 'p1', produto: 'Café' }]
    }
  });

describe('createMemoryClient', () => {
  it('lista na ordem padrão, com reference { id, title } e página', async () => {
    const r = await seed().list('pedido', { pageSize: 2 });
    expect(r.meta).toEqual({ page: 1, pageSize: 2, total: 3 });
    expect(r.data.map((x) => x.numero)).toEqual([3, 2]);
    expect(r.data[0].cliente).toEqual({ id: 'c1', title: 'Ana' });
  });

  it('busca pelo título do reference, filtra por condição e por data relativa', async () => {
    const c = seed();
    expect((await c.list('pedido', { q: 'bru' })).meta.total).toBe(1);
    expect((await c.list('pedido', { where: { field: 'situacao', op: 'eq', value: 'aberto' } })).meta.total).toBe(2);
    const mes = { field: 'data', op: 'gte' as const, value: { $date: 'monthStart' } };
    expect((await c.list('pedido', { where: mes })).data.map((x) => x.id)).toEqual(['p3', 'p2']);
  });

  it('agrega contagem e soma decimal, por grupo e por mês', async () => {
    const c = seed();
    expect(await c.aggregate('pedido', { measure: 'sum:total' })).toEqual([{ key: null, value: '16.75' }]);
    const porCliente = await c.aggregate('pedido', { groupBy: 'cliente' });
    expect(porCliente).toEqual([
      { key: 'c1', title: 'Ana', value: 2 },
      { key: 'c2', title: 'Bruno', value: 1 }
    ]);
    expect((await c.aggregate('pedido', { groupBy: 'data', interval: 'month' })).map((g) => g.key)).toEqual(['2026-10', '2026-11']);
  });

  it('grava com default, devolve as filhas with_parent e recusa obrigatório vazio', async () => {
    const c = seed();
    const novo = await c.create('pedido', { numero: 4, cliente: 'c2', item: [{ produto: 'Pão' }] });
    expect(novo.situacao).toBe('aberto');
    expect((novo.item as { produto: string }[]).map((i) => i.produto)).toEqual(['Pão']);
    const lido = await c.get('pedido', 'p1');
    expect((lido.item as unknown[]).length).toBe(1);
    await expect(c.create('pedido', { item: [{}] })).rejects.toMatchObject({
      status: 422,
      fields: { numero: [expect.objectContaining({ code: 'required' })], 'item.0.produto': [expect.anything()] }
    });
  });

  it('altera, exclui com as filhas e responde 501 na ação sem handler', async () => {
    const c = seed();
    expect((await c.update('pedido', 'p2', { total: '7.00' })).total).toBe('7.00');
    await c.remove('pedido', 'p1');
    await expect(c.get('pedido', 'p1')).rejects.toBeInstanceOf(ApiError);
    expect((await c.list('item')).meta.total).toBe(0);
    await expect(c.action('pedido', 'p2', 'cancelar')).rejects.toMatchObject({ status: 501 });
  });

  it('ação com handler altera o registro; em lote cada id passa ou falha sozinho; sem handler é 501', async () => {
    const c = seed();
    expect((await c.action('pedido', 'p2', 'pagar')).data?.situacao).toBe('pago');
    const bulk = await c.bulkAction('pedido', 'pagar', ['p1', 'p3']);
    expect(bulk.meta).toEqual({ ok: 1, failed: 1 });
    expect(bulk.results[0]).toMatchObject({ id: 'p1', ok: false, error: { code: 'conflict' } });
    expect((await c.get('pedido', 'p3')).situacao).toBe('pago');
    await expect(c.action('pedido', 'p2', 'outra')).rejects.toMatchObject({ status: 501 });
  });
});

describe('pedido livre (raw) na memória', () => {
  const client = createMemoryClient({
    app: { name: 'x', entities: ['c'] } as never,
    entities: [{ name: 'c', label: { singular: 'C', plural: 'Cs' }, fields: [{ name: 'nome', type: 'string' }] } as never],
    records: {
      c: [
        { id: '1', nome: 'Ana' },
        { id: '2', nome: 'Bia' }
      ]
    },
    files: { '/doc.json': { ok: true } }
  });
  const json = async (m: string, p: string) => {
    const r = await client.raw!(m, p);
    return [r.status, JSON.parse(r.body)];
  };

  it('arquivo, lista com query, registro e 404', async () => {
    expect(await json('GET', '/doc.json')).toEqual([200, { ok: true }]);
    const [, list] = await json('GET', '/c?pageSize=5&sort=nome&where=' + encodeURIComponent('{"field":"nome","op":"eq","value":"Bia"}'));
    expect(list.data.map((r: { id: string }) => r.id)).toEqual(['2']);
    expect((await json('GET', '/c/1'))[1].data.nome).toBe('Ana');
    expect((await json('GET', '/c/9'))[0]).toBe(404);
  });

  it('escrita, rota desconhecida e where inválido', async () => {
    expect((await json('POST', '/c'))[0]).toBe(501);
    expect((await json('GET', '/x'))[0]).toBe(501);
    expect((await json('GET', '/c/1/_files/a'))[0]).toBe(501);
    expect((await json('GET', '/c?where=%7B'))[0]).toBe(400);
  });
});

describe('consulta do sistema no adaptador em memória', () => {
  const dre: EntityDef = {
    name: 'dre',
    label: { singular: 'DRE', plural: 'DRE' },
    source: 'system',
    params: {
      fields: [
        { name: 'de', type: 'date', default: '2026-10-01' },
        { name: 'ate', type: 'date', default: { $date: 'today' } as never }
      ]
    },
    fields: [{ name: 'mes_10', type: 'decimal' }]
  };
  const client = createMemoryClient({
    app: { name: 't', entities: ['dre', 'cliente'], layout: { menu: [] } },
    entities: [dre, cliente],
    records: { dre: [{ id: '1', mes_10: '1.00' }] },
    sourceColumns: { dre: (p) => [{ field: 'mes_10', label: `out de ${p.de}` }] }
  });
  it('manda o default fixo dos parâmetros e as colunas pelos parâmetros', async () => {
    expect((await client.entity('dre')).paramDefaults).toEqual({ de: '2026-10-01' });
    expect((await client.entity('dre')).capabilities.create).toBe(false);
    expect((await client.entity('cliente')).paramDefaults).toBeUndefined();
    const res = await client.list('dre', { params: { de: '2026-09-01' } });
    expect(res.meta.columns).toEqual([{ field: 'mes_10', label: 'out de 2026-09-01' }]);
    expect((await client.list('cliente')).meta.columns).toBeUndefined();
  });
});

describe('prévia no adaptador em memória (#66)', () => {
  const client = createMemoryClient({
    app,
    entities: [cliente],
    previews: { cliente: { cupom: (input, id) => ({ message: `${id ?? 'lista'} ${input.n}` }) } }
  });
  it('responde pela função do seed, com fill vazio; sem ela, recusa', async () => {
    expect(await client.preview('cliente', 'cupom', undefined, { n: 2 })).toEqual({ fill: {}, message: 'lista 2' });
    expect(await client.preview('cliente', 'cupom', '7', { n: 1 })).toEqual({ fill: {}, message: '7 1' });
    await expect(client.preview('cliente', 'outra', undefined, {})).rejects.toThrow();
  });
});
