import { describe, expect, it } from 'vitest';

import { moveBy, moveTo, neighborOf } from './order';

describe('ordem das abas (#134)', () => {
  const ids = ['main', 'a', 'b', 'c'];
  it('moveBy anda as posições sem passar das pontas nem da parte fixa', () => {
    expect(moveBy(ids, 'b', -1, 1)).toEqual(['main', 'b', 'a', 'c']);
    expect(moveBy(ids, 'a', -1, 1)).toEqual(ids);
    expect(moveBy(ids, 'c', 1, 1)).toEqual(ids);
    expect(moveBy(ids, 'a', 5, 1)).toEqual(['main', 'b', 'c', 'a']);
    expect(moveBy(ids, 'main', 1, 1)).toEqual(ids);
    expect(moveBy(ids, 'a', 1)).toEqual(['main', 'b', 'a', 'c']);
  });
  it('moveTo põe na posição e ignora id desconhecido', () => {
    expect(moveTo(ids, 'c', 1)).toEqual(['main', 'c', 'a', 'b']);
    expect(moveTo(ids, 'a', 99)).toEqual(['main', 'b', 'c', 'a']);
    expect(moveTo(ids, 'a', -3)).toEqual(['a', 'main', 'b', 'c']);
    expect(moveTo(ids, 'x', 0)).toEqual(ids);
  });
  it('neighborOf: a da esquerda, senão a da direita', () => {
    expect(neighborOf(ids, 'b')).toBe('a');
    expect(neighborOf(['a', 'b'], 'a')).toBe('b');
    expect(neighborOf(['a'], 'a')).toBeUndefined();
    expect(neighborOf(ids, 'x')).toBeUndefined();
  });
});
