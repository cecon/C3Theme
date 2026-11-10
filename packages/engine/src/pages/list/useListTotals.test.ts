import { describe, expect, it } from 'vitest';

import { toCsv } from '../../export';
import type { EntityDef, FieldDef } from '../../types';
import { measuredFields, readTotals, totalFields, withRatios } from './useListTotals';

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

describe('total como razão (#58)', () => {
  const margem = {
    name: 'margem_produtos',
    label: { singular: 'Margem', plural: 'Margens' },
    fields: [
      { name: 'receita', type: 'decimal', scale: 2 },
      { name: 'margem', type: 'decimal', scale: 2 },
      { name: 'margem_percentual', type: 'decimal', scale: 1 },
      { name: 'itens', type: 'integer' }
    ],
    views: {
      list: {
        totals: [
          { field: 'receita' },
          { field: 'margem_percentual', measure: 'ratio', numerator: 'margem', denominator: 'receita', factor: 100 },
          { field: 'itens', measure: 'ratio', numerator: 'margem', denominator: 'receita' }
        ]
      }
    }
  } as EntityDef;
  const cols = ['receita', 'margem_percentual', 'itens'];

  it('soma os dois lados da razão uma vez só, mesmo fora das colunas', () => {
    expect(measuredFields(margem, cols)).toEqual(['receita', 'margem']);
    expect(measuredFields(margem, ['receita'])).toEqual(['receita']);
  });

  it('Σ numerator ÷ Σ denominator × factor, nas casas do campo; denominador zero dá vazio', () => {
    expect(withRatios(margem, cols, { receita: '2000.00', margem: '500.00' })).toEqual({
      receita: '2000.00',
      margem_percentual: '25.0',
      itens: 0
    });
    expect(withRatios(margem, cols, { receita: '0.00', margem: '10.00' })).toMatchObject({ margem_percentual: null });
    expect(withRatios(margem, cols, {})).toEqual({ margem_percentual: null, itens: null });
  });
});
