import { describe, expect, it } from 'vitest';

import type { ActionDef } from '../../actionTypes';
import type { EntityDef, FieldDef } from '../../types';
import { sumField, summaryFields, summaryText } from './selectionSum';

const total: FieldDef = { name: 'total', type: 'decimal', scale: 2, label: 'Total' };
const qty: FieldDef = { name: 'qty', type: 'integer', label: 'Quantidade' };
const def = { name: 'sale', label: { singular: 'Venda', plural: 'Vendas' }, fields: [total, qty] } as EntityDef;

describe('somas da seleção', () => {
  it('decimal soma na escala, sem erro de ponto flutuante; vazio conta zero', () => {
    expect(sumField(total, [{ total: '0.10' }, { total: '0.20' }, { total: null }])).toBe('0.30');
    expect(sumField(total, [{ total: '10.5' }, { total: '4.25' }])).toBe('14.75');
    expect(sumField(total, [{ total: '-1.05' }, { total: '0.05' }])).toBe('-1.00');
    expect(sumField({ ...total, scale: 3 }, [{ total: '1.001' }, { total: '2' }])).toBe('3.001');
  });

  it('integer soma como número', () => {
    expect(sumField(qty, [{ qty: 2 }, { qty: 3 }, {}])).toBe(5);
  });

  it('campos das ações sem repetir, e o texto só com campos numéricos', () => {
    const actions = [
      { name: 'a', label: 'A', bulk: 'together', summary: [{ field: 'total' }] },
      { name: 'b', label: 'B', bulk: true, summary: [{ field: 'total' }, { field: 'qty' }] }
    ] as ActionDef[];
    expect(summaryFields(actions)).toEqual(['total', 'qty']);
    const rows = [
      { total: '1.50', qty: 1 },
      { total: '2.00', qty: 2 }
    ];
    expect(summaryText(def, rows, ['total', 'qty', 'nope'], 'pt-BR', (t) => String(t))).toBe('Total: 3,50 · Quantidade: 3');
  });
});
