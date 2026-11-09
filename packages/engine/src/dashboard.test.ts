import { describe, expect, it } from 'vitest';

import {
  bothWhere,
  chartKind,
  fillTimeline,
  formatMeasure,
  MAX_FILLED,
  orderGroups,
  periodsUntil,
  share,
  widgetWhere,
  widgetWidth
} from './dashboard';
import type { EntityDef, FieldDef } from './types';

const stage: FieldDef = {
  name: 'stage',
  type: 'enum',
  label: 'Etapa',
  options: [
    { value: 'todo', label: 'A fazer' },
    { value: 'doing', label: 'Fazendo' },
    { value: 'done', label: 'Feito' }
  ]
} as FieldDef;
const due: FieldDef = { name: 'due', type: 'date', label: 'Prazo' } as FieldDef;
const def = {
  name: 'activity',
  fields: [stage, due],
  views: { list: { presets: [{ id: 'abertas', label: 'Abertas', where: { field: 'stage', op: 'ne', value: 'done' } }] } }
} as unknown as EntityDef;

describe('widgetWhere', () => {
  const extra = { field: 'due', op: 'gte', value: '2026-01-01' } as const;
  it('soma preset e where; um só fica como veio', () => {
    expect(widgetWhere({ type: 'kpi', title: 'x', entity: 'activity', preset: 'abertas', where: extra }, def)).toEqual({
      and: [{ field: 'stage', op: 'ne', value: 'done' }, extra]
    });
    expect(widgetWhere({ type: 'kpi', title: 'x', entity: 'activity', where: extra }, def)).toBe(extra);
    expect(widgetWhere({ type: 'kpi', title: 'x', entity: 'activity' }, def)).toBeUndefined();
  });
});

describe('fillTimeline', () => {
  it('completa os meses vazios com zero e tira o grupo sem data', () => {
    const got = fillTimeline(
      [
        { key: '2026-11', value: 2 },
        { key: '2027-02', value: 1 },
        { key: null, value: 5 }
      ],
      'month',
      0
    );
    expect(got.map((i) => [i.key, i.value])).toEqual([
      ['2026-11', 2],
      ['2026-12', 0],
      ['2027-01', 0],
      ['2027-02', 1]
    ]);
  });
  it('dia atravessa o fim do mês; ano soma um', () => {
    expect(
      fillTimeline(
        [
          { key: '2026-02-27', value: 1 },
          { key: '2026-03-01', value: 1 }
        ],
        'day',
        0
      ).map((i) => i.key)
    ).toEqual(['2026-02-27', '2026-02-28', '2026-03-01']);
    expect(
      fillTimeline(
        [
          { key: '2024', value: 1 },
          { key: '2026', value: '3.00' }
        ],
        'year',
        '0'
      ).map((i) => i.value)
    ).toEqual([1, '0', '3.00']);
  });
  it('intervalo grande demais fica só com o que veio', () => {
    const got = fillTimeline(
      [
        { key: '2000-01-01', value: 1 },
        { key: '2026-01-01', value: 1 }
      ],
      'day',
      0
    );
    expect(got).toHaveLength(2);
    expect(MAX_FILLED).toBeLessThan(9000);
  });
});

describe('demais regras', () => {
  it('enum na ordem de options', () => {
    const got = orderGroups(
      [
        { key: 'done', value: 9 },
        { key: 'todo', value: 1 },
        { key: null, value: 3 }
      ],
      stage
    );
    expect(got.map((i) => i.key)).toEqual(['todo', 'done', null]);
  });
  it('linha para data, barra para o resto; larguras padrão', () => {
    expect(chartKind({ type: 'chart', title: 'x', entity: 'a', groupBy: 'due' }, due)).toBe('line');
    expect(chartKind({ type: 'chart', title: 'x', entity: 'a', groupBy: 'stage' }, stage)).toBe('bar');
    expect(widgetWidth({ type: 'kpi', title: 'x', entity: 'a' })).toBe(3);
    expect(widgetWidth({ type: 'list', title: 'x', entity: 'a', width: 12 })).toBe(12);
  });
  it('soma de decimal sai com a escala do campo', () => {
    const total = { name: 'total', type: 'decimal', scale: 2, label: 'Total' } as FieldDef;
    expect(formatMeasure('1234.5', total, 'pt-BR')).toMatch(/1\.234,50/);
    expect(formatMeasure(1234, undefined, 'pt-BR')).toBe('1.234');
  });
});

describe('periodsUntil, bothWhere e share', () => {
  it('volta N períodos atravessando o ano', () => {
    expect(periodsUntil('2026-02', 4, 'month')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
    expect(periodsUntil('2026-03-01', 2, 'day')).toEqual(['2026-02-28', '2026-03-01']);
    expect(periodsUntil('2026', 3, 'year')).toEqual(['2024', '2025', '2026']);
  });
  it('junta os filtros e calcula a parte sem passar de 100', () => {
    const a = { field: 'status', op: 'eq' as const, value: 'paga' };
    expect(bothWhere(a, undefined)).toBe(a);
    expect(bothWhere(a, a)).toEqual({ and: [a, a] });
    expect(share(25, 100)).toBe(25);
    expect(share(5, 0)).toBe(0);
    expect(share(150, 100)).toBe(100);
  });
});
