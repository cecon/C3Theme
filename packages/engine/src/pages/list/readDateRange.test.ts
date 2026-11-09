import { describe, expect, it } from 'vitest';

import { readDateRange, readFilters } from './readFilters';
import { joinAnd } from './useListQuery';

describe('período da barra', () => {
  it('de e até viram gte e lte; sem campo ou sem valor, nada', () => {
    const p = new URLSearchParams('f.emissao.de=2026-09-01&f.emissao.ate=2026-09-30');
    expect(readDateRange(p, 'emissao')).toEqual([
      { field: 'emissao', op: 'gte', value: '2026-09-01' },
      { field: 'emissao', op: 'lte', value: '2026-09-30' }
    ]);
    expect(readDateRange(new URLSearchParams('f.emissao.de=2026-09-01'), 'emissao')).toHaveLength(1);
    expect(readDateRange(p, undefined)).toEqual([]);
  });

  it('os parâmetros do período não viram filtro de igualdade', () => {
    const p = new URLSearchParams('f.emissao.de=2026-09-01');
    expect(readFilters(p, [{ name: 'emissao', type: 'date' }])).toEqual([]);
  });

  it('junta com and só quando há mais de uma', () => {
    const a = { field: 'x', op: 'eq' as const, value: 1 };
    expect(joinAnd([])).toBeUndefined();
    expect(joinAnd([a])).toBe(a);
    expect(joinAnd([a, a])).toEqual({ and: [a, a] });
  });
});
