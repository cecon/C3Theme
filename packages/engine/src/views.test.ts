import { describe, expect, it } from 'vitest';

import { availableViews, boardColumns, canMoveCards, columnWhere, viewPath } from './views';
import type { Capabilities, EntityDef } from './types';

const def: EntityDef = {
  name: 'tarefa',
  label: { singular: 'Tarefa', plural: 'Tarefas' },
  fields: [
    {
      name: 'etapa',
      type: 'enum',
      options: [
        { value: 'a', label: 'A fazer' },
        { value: 'b', label: 'Fazendo' },
        { value: 'c', label: 'Feita' }
      ]
    },
    { name: 'prazo', type: 'date' }
  ],
  views: { board: { groupBy: 'etapa', columns: ['c', 'a'] }, calendar: { start: 'prazo' } }
};
const caps: Capabilities = { list: true, read: true, create: true, update: true, delete: true };

describe('views', () => {
  it('rota de cada tela leva o preset', () => {
    expect(viewPath('tarefa', 'list')).toBe('/tarefa');
    expect(viewPath('tarefa', 'board', 'minhas')).toBe('/tarefa/board?preset=minhas');
    expect(availableViews(def)).toEqual(['list', 'board', 'calendar']);
    expect(availableViews({ ...def, views: {} })).toEqual(['list']);
  });

  it('colunas seguem a ordem de columns e escondem o resto', () => {
    expect(boardColumns(def).map((c) => c.value)).toEqual(['c', 'a']);
    expect(boardColumns({ ...def, views: { board: { groupBy: 'etapa' } } }).map((c) => c.value)).toEqual(['a', 'b', 'c']);
  });

  it('coluna soma o filtro do preset', () => {
    const base = { field: 'prazo', op: 'null' as const, value: false };
    expect(columnWhere('etapa', 'a')).toEqual({ field: 'etapa', op: 'eq', value: 'a' });
    expect(columnWhere('etapa', 'a', base)).toEqual({ and: [base, { field: 'etapa', op: 'eq', value: 'a' }] });
  });

  it('só arrasta quem altera e com o campo livre', () => {
    expect(canMoveCards(def, caps)).toBe(true);
    expect(canMoveCards(def, { ...caps, update: false })).toBe(false);
    const locked = { ...def, fields: def.fields.map((f) => (f.name === 'etapa' ? { ...f, readOnly: true } : f)) };
    expect(canMoveCards(locked, caps)).toBe(false);
  });
});
