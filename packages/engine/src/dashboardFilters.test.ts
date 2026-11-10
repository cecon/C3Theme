import { describe, expect, it } from 'vitest';

import { widgetLink, type KpiWidget } from './dashboard';
import { applyFilters, initialValues, periodOptions, periodWhere, readValues, type DashboardFilter } from './dashboardFilters';

const filters: DashboardFilter[] = [
  { name: 'periodo', type: 'period', default: 'month' },
  { name: 'vendedor', type: 'reference', entity: 'seller' }
];
const kpi: KpiWidget = {
  type: 'kpi',
  title: 'Vendido',
  entity: 'sale',
  measure: 'sum:total',
  bind: { periodo: 'data', vendedor: 'seller_id' }
};

describe('filtros do painel', () => {
  it('período vira intervalo relativo [início, fim)', () => {
    expect(periodWhere('data', 'month')).toEqual({
      and: [
        { field: 'data', op: 'gte', value: { $date: 'monthStart' } },
        { field: 'data', op: 'lt', value: { $date: 'monthStart', offset: 1, unit: 'month' } }
      ]
    });
    expect(periodWhere('data', 'last7')).toEqual({
      and: [
        { field: 'data', op: 'gte', value: { $date: 'today', offset: -6 } },
        { field: 'data', op: 'lt', value: { $date: 'today', offset: 1 } }
      ]
    });
    expect(periodWhere('data', 'all')).toBeUndefined();
  });

  it('URL: período válido ou o default; reference com título; vazio limpa', () => {
    expect(readValues(new URLSearchParams(''), filters)).toEqual({ periodo: 'month' });
    expect(readValues(new URLSearchParams('f.periodo=year&f.vendedor=3&ft.vendedor=Ana'), filters)).toEqual({
      periodo: 'year',
      vendedor: { id: '3', title: 'Ana' }
    });
    expect(readValues(new URLSearchParams('f.periodo=nunca'), filters).periodo).toBe('month');
  });

  it('só os filtros ligados pelo bind entram, somados ao where do widget', () => {
    const where = { field: 'status', op: 'eq' as const, value: 'done' };
    const out = applyFilters({ ...kpi, where }, filters, { periodo: 'all', vendedor: { id: '3' } });
    expect(out.where).toEqual({ and: [where, { field: 'seller_id', op: 'eq', value: '3' }] });
    const free = { ...kpi, bind: undefined };
    expect(applyFilters(free, filters, { periodo: 'month' })).toBe(free);
  });

  it('o link leva o recorte para a lista em w', () => {
    expect(widgetLink({ ...kpi, preset: 'abertas' })).toBe('/sale?preset=abertas');
    const link = widgetLink(applyFilters(kpi, filters, { periodo: 'today' }));
    const w = JSON.parse(new URLSearchParams(link.split('?')[1]).get('w')!);
    expect(w.and[0]).toEqual({ field: 'data', op: 'gte', value: { $date: 'today' } });
  });
});

describe('períodos para a frente e options (#62)', () => {
  const venc: DashboardFilter[] = [{ name: 'venc', type: 'period', options: ['today', 'next7', 'next30', 'nextMonth'] }];
  it('sem default e sem all em options, abre no primeiro', () => {
    expect(initialValues(venc)).toEqual({ venc: 'today' });
    expect(initialValues([{ name: 'p', type: 'period' }])).toEqual({ p: 'all' });
    expect(initialValues([{ name: 'p', type: 'period', options: ['year', 'all'] }])).toEqual({ p: 'all' });
  });
  it('a URL só aceita o que options oferece', () => {
    expect(readValues(new URLSearchParams('f.venc=next30'), venc).venc).toBe('next30');
    expect(readValues(new URLSearchParams('f.venc=last30'), venc).venc).toBe('today');
  });
  it('options vazio ou ausente oferece todos', () => {
    expect(periodOptions({})).toContain('next7');
    expect(periodOptions({ options: [] })).toContain('all');
  });
  it('next7 vai de hoje até hoje+7 (exclusivo); nextMonth é o mês que vem', () => {
    expect(periodWhere('due', 'next7')).toEqual({
      and: [
        { field: 'due', op: 'gte', value: { $date: 'today' } },
        { field: 'due', op: 'lt', value: { $date: 'today', offset: 7 } }
      ]
    });
    expect(periodWhere('due', 'nextMonth')).toEqual({
      and: [
        { field: 'due', op: 'gte', value: { $date: 'monthStart', offset: 1, unit: 'month' } },
        { field: 'due', op: 'lt', value: { $date: 'monthStart', offset: 2, unit: 'month' } }
      ]
    });
  });
});
