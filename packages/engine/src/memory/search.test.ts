import { describe, expect, it } from 'vitest';

import type { AppDef, EntityDef } from '../types';
import { createMemoryClient } from './memoryClient';

// Ctrl K em memória (#24): campos de busca da lista, sem acento, na ordem das entidades, cortado no limit.
const produto: EntityDef = {
  name: 'produto',
  label: { singular: 'Produto', plural: 'Produtos' },
  icon: 'Box',
  titleField: 'nome',
  fields: [
    { name: 'nome', type: 'string' },
    { name: 'marca', type: 'string' }
  ],
  views: { list: { search: ['nome', 'marca'] } }
};
const nota: EntityDef = {
  name: 'nota',
  label: { singular: 'Nota', plural: { id: 'x.notas', defaultMessage: 'Notas' } },
  fields: [{ name: 'texto', type: 'string' }]
};

const client = createMemoryClient({
  app: { name: 'demo', entities: ['produto', 'nota'], layout: { menu: [] } } as unknown as AppDef,
  entities: [produto, { ...nota, titleField: 'texto' }],
  records: {
    produto: [
      { id: '1', nome: 'Pão francês', marca: 'Padaria' },
      { id: '2', nome: 'Bolo', marca: 'Pãozinho' },
      { id: '3', nome: 'Café', marca: null }
    ],
    nota: [{ id: '9', texto: 'Comprar pao' }]
  }
});

describe('busca em memória', () => {
  it('acha sem acento em qualquer campo de busca e monta o achado', async () => {
    const hits = await client.search!('PAO', 20);
    expect(hits.map((h) => h.path)).toEqual(['/produto/1', '/produto/2', '/nota/9']);
    expect(hits[0]).toEqual({
      kind: 'produto',
      group: 'Produtos',
      title: 'Pão francês',
      snippet: 'Padaria',
      path: '/produto/1',
      icon: 'Box',
      at: null
    });
    expect(hits[2]).toMatchObject({ group: 'Notas', snippet: null, icon: null });
  });

  it('corta no limit', async () => {
    expect(await client.search!('pao', 2)).toHaveLength(2);
    expect(await client.search!('zzz', 5)).toEqual([]);
  });
});
