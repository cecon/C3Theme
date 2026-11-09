import { describe, expect, it } from 'vitest';

import { loadEntities, referencedEntities } from './access';
import type { C3Client } from './api';
import type { EntityDef } from './types';

const def = (name: string, extra: Partial<EntityDef> = {}): EntityDef => ({
  name,
  label: { singular: name, plural: name },
  fields: [{ name: 'id', type: 'string' }],
  ...extra
});

const product = def('product', {
  fields: [
    { name: 'group', type: 'reference', entity: 'group' },
    { name: 'parent', type: 'reference', entity: 'product' }
  ],
  views: { form: { sections: [{ related: { entity: 'product_tax', field: 'product' } }] } },
  actions: [{ name: 'move', label: 'Mover', input: { fields: [{ name: 'to', type: 'reference', entity: 'stock' }] } }]
});
const tax = def('product_tax', { fields: [{ name: 'uf', type: 'reference', entity: 'uf' }] });
const all: Record<string, EntityDef> = { product, product_tax: tax, group: def('group'), uf: def('uf') };
const caps = { list: true, read: true, create: true, update: true, delete: true };

describe('referencedEntities', () => {
  it('junta reference, input de ação e filhas, sem a própria entidade', () => {
    expect(referencedEntities(product).sort()).toEqual(['group', 'product_tax', 'stock']);
  });
});

describe('loadEntities', () => {
  it('carrega as citadas de forma transitiva e ignora a citada que o backend recusa', async () => {
    const asked: string[] = [];
    const client = {
      entity: async (name: string) => {
        asked.push(name);
        if (!all[name]) throw new Error('404');
        return { data: all[name], capabilities: caps };
      }
    } as unknown as C3Client;
    const loaded = await loadEntities(client, ['product']);
    expect(Object.keys(loaded).sort()).toEqual(['group', 'product', 'product_tax', 'uf']);
    expect(asked.filter((n) => n === 'product')).toHaveLength(1);
  });
  it('a entidade pedida que falha derruba a carga', async () => {
    const client = { entity: async () => Promise.reject(new Error('403')) } as unknown as C3Client;
    await expect(loadEntities(client, ['product'])).rejects.toThrow('403');
  });
});
