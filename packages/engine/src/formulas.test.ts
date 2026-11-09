import { describe, expect, it } from 'vitest';

import { evalFormula, formulaRefs, parseFormula } from './formulas.mjs';

const run = (src: string, record: Record<string, unknown> = {}, vars?: Record<string, number>) =>
  evalFormula(parseFormula(src), record, vars);

describe('fórmulas de exibição', () => {
  it('respeita a precedência e os parênteses', () => {
    expect(run('2 + 3 * 4')).toBe(14);
    expect(run('(2 + 3) * 4')).toBe(20);
    expect(run('10 - 4 - 3')).toBe(3);
    expect(run('-2 * 3')).toBe(-6);
  });

  it('lê campos trafegados como texto e trata vazio como 0', () => {
    expect(run('quantidade * preco', { quantidade: 3, preco: '150.50' })).toBe(451.5);
    expect(run('quantidade * preco', { quantidade: null, preco: '' })).toBe(0);
  });

  it('divisão por zero dá 0', () => {
    expect(run('10 / desconto', { desconto: '0' })).toBe(0);
  });

  it('soma uma conta sobre as linhas de uma lista', () => {
    const fatura = {
      fatura_item: [
        { quantidade: 3, preco: '150' },
        { quantidade: 1, preco: '100' }
      ]
    };
    expect(run('sum(fatura_item, quantidade * preco)', fatura)).toBe(550);
    expect(run('sum(fatura_item, quantidade)', {})).toBe(0);
  });

  it('linhas anteriores do resumo valem antes dos campos', () => {
    expect(run('subtotal * desconto / 100', { desconto: '10', subtotal: '999' }, { subtotal: 550 })).toBe(55);
  });

  it('recusa sintaxe quebrada', () => {
    expect(() => parseFormula('quantidade *')).toThrow(/terminou/);
    expect(() => parseFormula('a $ b')).toThrow(/caractere/);
    expect(() => parseFormula('(a + b')).toThrow(/esperava/);
    expect(() => parseFormula('a b')).toThrow(/sobrou/);
  });

  it('lista os nomes citados, separando os de cada sum', () => {
    expect(formulaRefs(parseFormula('sum(itens, qtd * preco) - desconto'))).toEqual({
      own: ['desconto'],
      lists: { itens: ['qtd', 'preco'] }
    });
  });
});
