import { describe, expect, it } from 'vitest';

import { dayWhere, heatLevel, heatmapWeeks } from './dashboardHeatmap';

describe('heatmap', () => {
  it('força de 0 a 4 sobre o maior valor', () => {
    expect([0, 1, 5, 6, 10].map((v) => heatLevel(v, 10))).toEqual([0, 1, 2, 3, 4]);
    expect(heatLevel(3, 0)).toBe(0);
  });

  it('dados de um ano só: janeiro a dezembro, semanas de domingo a sábado', () => {
    const weeks = heatmapWeeks([
      { key: '2026-03-02', value: 4 },
      { key: '2026-03-03', value: '1.50' },
      { key: null, value: 9 }
    ]);
    const days = weeks.flat().filter(Boolean);
    expect(days).toHaveLength(365);
    expect(days[0]!.day).toBe('2026-01-01');
    expect(days[days.length - 1]!.day).toBe('2026-12-31');
    // 1º de janeiro de 2026 é quinta: domingo a quarta ficam de fora
    expect(weeks[0].slice(0, 4)).toEqual([null, null, null, null]);
    const mar = days.find((c) => c!.day === '2026-03-02')!;
    expect(mar).toMatchObject({ value: 4, level: 4 });
    expect(days.find((c) => c!.day === '2026-03-03')).toMatchObject({ value: 1.5, raw: '1.50', level: 2 });
  });

  it('sem dados: o ano de hoje; dois anos: do primeiro ao último dia', () => {
    expect(
      heatmapWeeks([], new Date(2025, 5, 1))
        .flat()
        .filter(Boolean)[0]!.day
    ).toBe('2025-01-01');
    const days = heatmapWeeks([
      { key: '2025-12-30', value: 1 },
      { key: '2026-01-02', value: 1 }
    ])
      .flat()
      .filter(Boolean)
      .map((c) => c!.day);
    expect(days).toEqual(['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02']);
  });

  it('o clique filtra o dia: eq em date, a meia-noite local em datetime', () => {
    expect(dayWhere('quando', 'date', '2026-03-02')).toEqual({ field: 'quando', op: 'eq', value: '2026-03-02' });
    const w = dayWhere('quando', 'datetime', '2026-03-02') as { and: { value: string }[] };
    expect(new Date(w.and[0].value).getDate()).toBe(2);
    expect(new Date(w.and[1].value).getTime() - new Date(w.and[0].value).getTime()).toBe(86_400_000);
  });
});
