import { describe, expect, it } from 'vitest';

import { skeletonCells, skeletonWidth } from './widths';

describe('skeletonWidth', () => {
  it('fica entre 45% e 89% e é a mesma para a mesma posição', () => {
    for (let i = 0; i < 200; i++) {
      const w = parseInt(skeletonWidth(i), 10);
      expect(w).toBeGreaterThanOrEqual(45);
      expect(w).toBeLessThanOrEqual(89);
      expect(skeletonWidth(i)).toBe(skeletonWidth(i));
    }
  });

  it('varia entre posições vizinhas', () => {
    expect(new Set([0, 1, 2, 3, 4].map(skeletonWidth)).size).toBe(5);
  });
});

describe('skeletonCells', () => {
  it('quantidade vira colunas de texto', () => {
    expect(skeletonCells(3)).toEqual(['text', 'text', 'text']);
    expect(skeletonCells(-1)).toEqual([]);
  });

  it('lista de tipos passa como está', () => {
    expect(skeletonCells(['check', 'number'])).toEqual(['check', 'number']);
  });
});
