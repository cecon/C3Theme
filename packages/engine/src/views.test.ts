import { describe, expect, it, vi } from 'vitest';

import { availableViews, boardColumns, canMoveCards, columnWhere, listUpTo, viewPath } from './views';
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

describe('listUpTo', () => {
  const client = (total: number) => {
    const rows = Array.from({ length: total }, (_, i) => ({ id: String(i + 1) }));
    const list = vi.fn(async (_e: string, p: { page: number; pageSize: number }) => ({
      data: rows.slice((p.page - 1) * p.pageSize, p.page * p.pageSize),
      meta: { page: p.page, pageSize: p.pageSize, total }
    }));
    return { list } as never as Parameters<typeof listUpTo>[0] & { list: typeof list };
  };

  it('só pede tamanho de página do contrato (10, 25, 50, 100): limite 5 pede 10 e corta', async () => {
    const c = client(30);
    const out = await listUpTo(c, 'x', {}, 5);
    expect(c.list.mock.calls.map((a) => a[1].pageSize)).toEqual([10]);
    expect(out.total).toBe(30);
    expect(out.rows).toHaveLength(5);
  });

  it('acima de 100, páginas de 100 até o limite', async () => {
    const c = client(250);
    const out = await listUpTo(c, 'x', {}, 200);
    expect(c.list.mock.calls.map((a) => [a[1].page, a[1].pageSize])).toEqual([
      [1, 100],
      [2, 100]
    ]);
    expect(out.rows).toHaveLength(200);
    expect((await listUpTo(client(3), 'x', {}, 42)).rows).toHaveLength(3);
  });
});
