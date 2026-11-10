import { describe, expect, it } from 'vitest';

import { displayValue, formatAmount, keepsTogether } from './format';
import type { FieldDef } from './types';

describe('valor numa linha só', () => {
  it('código, data e e-mail não quebram; texto com espaço quebra', () => {
    expect(keepsTogether('FAT-2026-1026')).toBe(true);
    expect(keepsTogether('15/10/2026')).toBe(true);
    expect(keepsTogether('ana@empresa.com.br')).toBe(true);
    expect(keepsTogether('Construtora Horizonte')).toBe(false);
    expect(keepsTogether('')).toBe(false);
  });

  it('dinheiro fica junto porque o símbolo vem separado por espaço não separável (U+00A0)', () => {
    const total = { name: 'total', type: 'decimal', scale: 2, currency: 'BRL' } as FieldDef;
    const shown = formatAmount('9568.2', total, 'pt-BR');
    expect(shown).toBe('R$ 9.568,20');
    expect(keepsTogether(shown)).toBe(true);
    expect(keepsTogether('R$ 9.568,20')).toBe(false);
  });
});

describe('displayValue de integer', () => {
  const show = (field: Partial<FieldDef>, v: unknown) =>
    displayValue({ name: 'n', type: 'integer', ...field } as FieldDef, v, 'pt-BR', String);
  it('agrupa o milhar por padrão e grouping: false mostra seco (#168)', () => {
    expect(show({}, 8788)).toBe('8.788');
    expect(show({ grouping: false }, 8788)).toBe('8788');
    expect(show({ grouping: false, unit: 'un' }, 12345)).toBe('12345 un');
  });
});
