import { describe, expect, it } from 'vitest';

import type { EntityDef } from './types';
import { createdPath } from './views';

const agente = { name: 'agente', label: { singular: 'Agente', plural: 'Agentes' }, fields: [] } as unknown as EntityDef;
const withAfter = (afterCreate: string) => ({ ...agente, views: { form: { sections: [], afterCreate } } }) as EntityDef;

describe('createdPath (#164)', () => {
  it('sem afterCreate abre o registro criado', () => {
    expect(createdPath(agente, { id: '7' })).toBe('/agente/7');
  });

  it('troca {campo} pelo valor gravado; reference usa o id', () => {
    expect(createdPath(withAfter('/conversa/{id}'), { id: '7' })).toBe('/conversa/7');
    expect(createdPath(withAfter('/canal/{equipe}/{id}'), { id: '7', equipe: { id: 'e 1', title: 'Vendas' } })).toBe('/canal/e%201/7');
  });

  it('campo vazio ou ausente volta ao padrão', () => {
    expect(createdPath(withAfter('/conversa/{canal}'), { id: '7' })).toBe('/agente/7');
    expect(createdPath(withAfter('/conversa/{canal}'), { id: '7', canal: null })).toBe('/agente/7');
  });
});
