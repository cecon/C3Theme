import { describe, expect, it } from 'vitest';

import { activeShortcut, periodProblem, shortcutPeriod } from './period';

// 29/10/2026, quinta-feira, meio do dia local
const today = new Date(2026, 9, 29, 12);

describe('atalhos de período', () => {
  it('calcula cada atalho no dia local', () => {
    expect(shortcutPeriod('today', today)).toEqual({ from: '2026-10-29', to: '2026-10-29' });
    expect(shortcutPeriod('yesterday', today)).toEqual({ from: '2026-10-28', to: '2026-10-28' });
    expect(shortcutPeriod('last7', today)).toEqual({ from: '2026-10-23', to: '2026-10-29' });
    expect(shortcutPeriod('thisMonth', today)).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    expect(shortcutPeriod('lastMonth', today)).toEqual({ from: '2026-09-01', to: '2026-09-30' });
  });
  it('vira o ano e o fevereiro', () => {
    expect(shortcutPeriod('lastMonth', new Date(2027, 0, 5))).toEqual({ from: '2026-12-01', to: '2026-12-31' });
    expect(shortcutPeriod('thisMonth', new Date(2028, 1, 10))).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });
  it('reconhece o atalho do período escolhido', () => {
    expect(activeShortcut({ from: '2026-10-01', to: '2026-10-31' }, today)).toBe('thisMonth');
    expect(activeShortcut({ from: '2026-10-02', to: '2026-10-31' }, today)).toBeNull();
  });
});

describe('periodProblem', () => {
  it('recusa início depois do fim e ponta faltando quando obrigatório', () => {
    expect(periodProblem({ from: '2026-10-30', to: '2026-10-01' })).toBe('order');
    expect(periodProblem({ from: null, to: '2026-10-01' })).toBeNull();
    expect(periodProblem({ from: null, to: '2026-10-01' }, true)).toBe('missing');
    expect(periodProblem({ from: '2026-10-01', to: '2026-10-01' }, true)).toBeNull();
  });
});
