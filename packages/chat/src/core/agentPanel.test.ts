import { describe, expect, it } from 'vitest';

import { clampPercent, contextLevel, timelineRows, type AgentEvent } from './agentPanel';

const ev = (id: string, at: string): AgentEvent => ({ id, at, kind: 'tool', text: id });
const now = new Date('2026-11-09T15:00:00');

describe('timelineRows', () => {
  it('um dia só, de hoje: sem separador', () => {
    const rows = timelineRows([ev('a', '2026-11-09T10:43:00'), ev('b', '2026-11-09T10:41:00')], now);
    expect(rows.map((r) => r.day)).toEqual([undefined, undefined]);
  });

  it('dia muda: separador no primeiro evento de cada dia', () => {
    const rows = timelineRows([ev('a', '2026-11-09T09:00:00'), ev('b', '2026-11-08T22:00:00'), ev('c', '2026-11-08T21:00:00')], now);
    expect(rows.map((r) => !!r.day)).toEqual([false, true, false]);
  });

  it('lista que não começa hoje: separador já no primeiro', () => {
    const rows = timelineRows([ev('a', '2026-11-07T09:00:00')], now);
    expect(rows[0].day).toBe('2026-11-07T09:00:00');
  });
});

describe('medidor de contexto', () => {
  it('porcentagem fica entre 0 e 100 e inteira', () => {
    expect(clampPercent(62.4)).toBe(62);
    expect(clampPercent(-5)).toBe(0);
    expect(clampPercent(130)).toBe(100);
    expect(clampPercent(Number.NaN)).toBe(0);
  });

  it('avisa a 10 pontos do resumo automático', () => {
    expect(contextLevel(62, 85)).toBe('ok');
    expect(contextLevel(75, 85)).toBe('near');
    expect(contextLevel(90, 85)).toBe('near');
  });

  it('sem limite de resumo: avisa a partir de 90%', () => {
    expect(contextLevel(89)).toBe('ok');
    expect(contextLevel(90)).toBe('near');
  });
});
