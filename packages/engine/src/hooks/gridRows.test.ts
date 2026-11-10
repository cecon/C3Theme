import { describe, expect, it } from 'vitest';

import { gridBody, mergeGridFill, newRow, selectionInput, setCell } from './gridRows';
import type { ActionDef, GridFieldDef } from '../actionTypes';

const grid: GridFieldDef = {
  name: 'prices',
  type: 'grid',
  label: 'Preços',
  required: true,
  maxItems: 2,
  fields: [
    { name: 'product', type: 'reference', entity: 'product', required: true, readOnly: true },
    { name: 'price', type: 'decimal', scale: 2, required: true, default: '0.00' }
  ]
};

describe('gridBody', () => {
  it('manda o id do reference e todas as colunas', () => {
    const { rows, errors } = gridBody(grid, [{ product: { id: '3', title: 'Água' }, price: '4.50' }]);
    expect(errors).toEqual({});
    expect(rows).toEqual([{ product: '3', price: '4.50' }]);
  });

  it('erro por célula na chave do backend (grade.linha.coluna)', () => {
    const { errors } = gridBody(grid, [
      { product: '3', price: '1.00' },
      { product: '4', price: '' }
    ]);
    expect(errors).toEqual({ 'prices.1.price': 'Campo obrigatório.' });
  });

  it('mínimo e máximo de linhas', () => {
    expect(gridBody(grid, []).errors).toHaveProperty('prices');
    expect(gridBody(grid, undefined).errors).toHaveProperty('prices');
    const three = Array.from({ length: 3 }, () => ({ product: '1', price: '1' }));
    expect(gridBody(grid, three).errors.prices).toMatch(/máximo 2/);
    expect(gridBody({ ...grid, required: false }, []).errors).toEqual({});
  });
});

describe('linhas', () => {
  it('linha nova com os defaults e troca de uma célula só', () => {
    expect(newRow(grid)).toEqual({ price: '0.00' });
    const rows = [{ price: '1' }, { price: '2' }];
    const next = setCell(rows, 1, 'price', '9');
    expect(next).toEqual([{ price: '1' }, { price: '9' }]);
    expect(next[0]).toBe(rows[0]);
  });
});

describe('mergeGridFill', () => {
  const agua = { id: '3', title: 'Água' };
  const suco = { id: '4', title: 'Suco' };
  it('troca as linhas e mantém a célula que o usuário mudou na linha de mesma chave', () => {
    const before = [
      { product: agua, price: '4.00' },
      { product: suco, price: '9.00' }
    ];
    const current = [
      { product: agua, price: '5.00' },
      { product: suco, price: '9.00' }
    ];
    const next = [
      { product: suco, price: '9.90' },
      { product: agua, price: '4.40' }
    ];
    expect(mergeGridFill(grid, current, before, next)).toEqual([
      { product: suco, price: '9.90' },
      { product: agua, price: '5.00' }
    ]);
  });

  it('sem coluna readOnly, as linhas do sistema entram inteiras', () => {
    const free: GridFieldDef = { ...grid, fields: [{ name: 'price', type: 'decimal' }] };
    expect(mergeGridFill(free, [{ price: '1' }], [], [{ price: '2' }])).toEqual([{ price: '2' }]);
  });
});

describe('selectionInput', () => {
  it('abre a grade fromSelection com uma linha por registro marcado', () => {
    const labels = {
      name: 'labels',
      label: 'Etiquetas',
      bulk: 'together',
      input: {
        fields: [
          {
            name: 'items',
            type: 'grid',
            label: 'Itens',
            fromSelection: 'product',
            fields: [
              { name: 'product', type: 'reference', entity: 'product', readOnly: true },
              { name: 'price', type: 'decimal', readOnly: true },
              { name: 'copies', type: 'integer', default: 1 }
            ]
          },
          { ...grid, name: 'outra' }
        ]
      }
    } as ActionDef;
    const rows = [{ id: '3', name: 'Água', price: '4.00' }];
    expect(selectionInput(labels, rows, (r) => String(r.name))).toEqual({
      items: [{ product: { id: '3', title: 'Água' }, price: '4.00', copies: 1 }]
    });
  });
});
