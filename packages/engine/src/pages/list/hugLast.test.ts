import { describe, expect, it } from 'vitest';

import { hugsLastColumn } from './hugLast';

const col = (type: string, extra: { width?: number; component?: string } = {}) => ({ def: { type } as never, ...extra });

describe('hugsLastColumn', () => {
  it('abraça status, data e número no fim da linha', () => {
    expect(hugsLastColumn([col('string'), col('enum')])).toBe(true);
    expect(hugsLastColumn([col('string'), col('date')])).toBe(true);
    expect(hugsLastColumn([col('string'), col('decimal')])).toBe(true);
  });

  it('deixa texto, largura fixa e componente próprio como estão', () => {
    expect(hugsLastColumn([col('enum'), col('string')])).toBe(false);
    expect(hugsLastColumn([col('enum', { width: 120 })])).toBe(false);
    expect(hugsLastColumn([col('enum', { component: 'Badge' })])).toBe(false);
    expect(hugsLastColumn([])).toBe(false);
  });
});
