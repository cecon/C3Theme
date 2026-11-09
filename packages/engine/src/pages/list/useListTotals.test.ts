import { describe, expect, it } from 'vitest';

import { toCsv } from '../../export';
import type { EntityDef, FieldDef } from '../../types';
import { readTotals, totalFields } from './useListTotals';

const fields: FieldDef[] = [
  { name: 'number', type: 'integer', label: 'Número' },
  { name: 'total', type: 'decimal', scale: 2, label: 'Total' },
  { name: 'discount', type: 'decimal', scale: 2, label: 'Desconto' }
];
const def = {
  name: 'sale',
  label: { singular: 'Venda', plural: 'Vendas' },
  fields,
  views: { list: { totals: [{ field: 'total' }, { field: 'discount' }] } }
} as EntityDef;

describe('totais da lista', () => {
  it('só soma o que está nas colunas (campo oculto já saiu delas)', () => {
    expect(totalFields(def, ['number', 'total', 'discount'])).toEqual(['total', 'discount']);
    expect(totalFields(def, ['number', 'total'])).toEqual(['total']);
    expect(totalFields({ ...def, views: {} }, ['total'])).toEqual([]);
  });

  it('lê value com uma medida e values com várias', () => {
    expect(readTotals(['total'], [{ key: null, value: '10.50' }])).toEqual({ total: '10.50' });
    expect(readTotals(['total', 'discount'], [{ key: null, value: '10.50', values: ['10.50', '1.00'] }])).toEqual({
      total: '10.50',
      discount: '1.00'
    });
    expect(readTotals(['total'], [])).toEqual({});
  });

  it('CSV ganha a linha de total, com o rótulo na primeira coluna que não soma', () => {
    const csv = toCsv(
      fields,
      [{ id: '1', number: 7, total: '10.50', discount: '1.00' }],
      'pt-BR',
      (f) => String(f.label),
      (_, v) => v,
      { total: '10.50', discount: '1.00' }
    );
    expect(csv.split('\r\n')).toEqual(['\uFEFFNúmero;Total;Desconto', '7;"10,50";"1,00"', 'Total;"10,50";"1,00"']);
  });
});
