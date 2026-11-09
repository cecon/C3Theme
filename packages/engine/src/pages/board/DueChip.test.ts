import { describe, expect, it } from 'vitest';

import { daysUntil, dueLook } from './DueChip';

describe('prazo do cartão', () => {
  it('conta os dias pelo calendário local', () => {
    const today = new Date(2026, 10, 6, 23, 30);
    expect(daysUntil('2026-11-06', today)).toBe(0);
    expect(daysUntil('2026-11-08', today)).toBe(2);
    expect(daysUntil('2026-11-05', today)).toBe(-1);
  });

  it('vencido vermelho, até 2 dias amarelo, concluído verde', () => {
    expect(dueLook(-1, false)).toEqual({ tone: 'danger', hint: 'Atrasado' });
    expect(dueLook(0, false).tone).toBe('warning');
    expect(dueLook(2, false)).toEqual({ tone: 'warning', hint: 'Vence em 2 dias' });
    expect(dueLook(3, false).tone).toBe('neutral');
    expect(dueLook(-5, true).tone).toBe('success');
  });
});
