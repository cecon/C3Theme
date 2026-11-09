import { describe, expect, it } from 'vitest';

import { suggestions } from './suggest';

describe('suggestions', () => {
  it('preenche o vazio e atualiza a sugestão anterior, mas não o que o usuário digitou', () => {
    const known = ['percent', 'price'];
    expect(suggestions({ percent: '10', price: null }, { price: '26.01' }, known, {})).toEqual({ price: '26.01' });
    expect(suggestions({ percent: '20', price: '26.01' }, { price: '23.12' }, known, { price: '26.01' })).toEqual({ price: '23.12' });
    expect(suggestions({ percent: '20', price: '25.00' }, { price: '23.12' }, known, { price: '26.01' })).toEqual({});
  });

  it('ignora campo que o input não declara', () => {
    expect(suggestions({}, { other: 1 }, ['price'], {})).toEqual({});
  });
});
