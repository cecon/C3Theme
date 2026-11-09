import { describe, expect, it } from 'vitest';

import { matchingRows, nextRow } from './gridFind';

const names = ['Açúcar refinado 1 kg', 'Arroz tipo 1', 'Café torrado', 'Açaí 500 ml'];
const texts = (i: number) => [names[i], String(i + 10)];

describe('busca na grade', () => {
  it('sem acento, sem caixa, todas as palavras', () => {
    expect(matchingRows(4, texts, '')).toEqual([0, 1, 2, 3]);
    expect(matchingRows(4, texts, 'acucar')).toEqual([0]);
    expect(matchingRows(4, texts, 'AÇA')).toEqual([3]);
    expect(matchingRows(4, texts, 'tipo 1')).toEqual([1]);
    expect(matchingRows(4, texts, '12')).toEqual([2]);
    expect(matchingRows(4, texts, 'feijão')).toEqual([]);
  });

  it('Enter vai para a próxima linha visível; nas pontas, para', () => {
    const visible = [0, 2, 3];
    expect(nextRow(visible, 0, false)).toBe(2);
    expect(nextRow(visible, 2, true)).toBe(0);
    expect(nextRow(visible, 3, false)).toBeUndefined();
    expect(nextRow(visible, 0, true)).toBeUndefined();
    expect(nextRow(visible, 1, false)).toBeUndefined();
  });
});
