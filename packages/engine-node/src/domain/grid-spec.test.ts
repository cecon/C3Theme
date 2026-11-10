// Grade `fromSelection` na spec da ação: coluna reference da própria entidade, só em ação em conjunto.
import { describe, expect, it } from 'vitest';

import { parseAction } from './action-spec';

const ident = (n: string) => /^[a-z_][a-z0-9_]*$/.test(n);
const grid = (fromSelection: string, entity = 'product') => ({
  name: 'items',
  type: 'grid',
  label: 'Itens',
  fromSelection,
  fields: [
    { name: 'product', type: 'reference', entity, label: 'Produto', readOnly: true },
    { name: 'copies', type: 'integer', label: 'Etiquetas' }
  ]
});
const action = (bulk: unknown, g: unknown) => ({ name: 'labels', label: 'Etiquetas', bulk, input: { fields: [g] } });

describe('fromSelection', () => {
  it('guarda a coluna da seleção na ação em conjunto', () => {
    const [a] = parseAction('product', action('together', grid('product')), [], ident);
    expect(a.grids[0].fromSelection).toBe('product');
  });

  it('recusa coluna que não é reference, ação que não é em conjunto ou reference para outra entidade', () => {
    expect(() => parseAction('product', action('together', grid('copies')), [], ident)).toThrow(/coluna reference da grade/);
    expect(() => parseAction('product', action(true, grid('product')), [], ident)).toThrow(/só em ação bulk "together"/);
    expect(() => parseAction('product', action('together', grid('product', 'group')), [], ident)).toThrow(/reference para 'product'/);
  });
});

describe('maxItems da grade (#49)', () => {
  const sized = (maxItems: number) => ({ ...grid('product'), fromSelection: undefined, maxItems });
  it('aceita até 990 linhas (os itens de uma NF-e) e recusa acima', () => {
    const [a] = parseAction('product', action(undefined, sized(990)), [], ident);
    expect(a.grids[0].maxItems).toBe(990);
    expect(() => parseAction('product', action(undefined, sized(991)), [], ident)).toThrow(/maxItems de 1 a 990/);
  });
});
