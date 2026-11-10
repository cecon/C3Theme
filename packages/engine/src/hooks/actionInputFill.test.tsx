// @vitest-environment jsdom
// Prévia que refaz a grade do input (#41): as linhas do sistema trocam as da tela, e o que o usuário digitou fica.
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ActionDef } from '../actionTypes';
import useActionInput from './useActionInput';

const reprice: ActionDef = {
  name: 'reprice',
  label: 'Reajustar',
  target: 'list',
  input: {
    fields: [
      { name: 'percent', type: 'decimal' },
      {
        name: 'prices',
        type: 'grid',
        label: 'Preços',
        fields: [
          { name: 'product', type: 'reference', entity: 'product', readOnly: true },
          { name: 'price', type: 'decimal' }
        ]
      }
    ]
  }
};

const agua = { id: '3', title: 'Água' };
const suco = { id: '4', title: 'Suco' };

describe('useActionInput.fill com grade', () => {
  it('troca as linhas da grade e mantém o preço que o usuário digitou', () => {
    const { result } = renderHook(() => useActionInput(reprice));
    act(() =>
      result.current.reset(reprice, {
        prices: [
          { product: agua, price: '4.00' },
          { product: suco, price: '9.00' }
        ]
      })
    );
    act(() => result.current.changeCell('prices', 1, 'price', '12.00'));
    act(() =>
      result.current.fill({
        percent: '10',
        prices: [
          { product: agua, price: '4.40' },
          { product: suco, price: '9.90' }
        ]
      })
    );
    expect(result.current.input.prices).toEqual([
      { product: agua, price: '4.40' },
      { product: suco, price: '12.00' }
    ]);
    // a segunda prévia compara com o que o sistema mandou por último
    act(() => result.current.fill({ prices: [{ product: agua, price: '4.80' }] }));
    expect(result.current.input.prices).toEqual([{ product: agua, price: '4.80' }]);
  });
});
