// Filtros do painel (app.json pages[].dashboard.filters): o usuário escolhe o período e um registro (a filial, o
// vendedor), e cada widget liga o filtro a um campo dele (`bind`). Sem React: a tela fica em pages/dashboard.

import type { Condition, Text } from './types';
import type { WidgetDef } from './dashboard';

/** Períodos do filtro `period`, resolvidos no backend pelo relógio do sistema (datas relativas). */
export const PERIODS = ['today', 'week', 'month', 'lastMonth', 'last7', 'last30', 'year', 'all'] as const;
export type Period = (typeof PERIODS)[number];

export const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoje',
  week: 'Esta semana',
  month: 'Este mês',
  lastMonth: 'Mês passado',
  last7: 'Últimos 7 dias',
  last30: 'Últimos 30 dias',
  year: 'Este ano',
  all: 'Tudo'
};

export type DashboardFilter =
  { name: string; type: 'period'; label?: Text; default?: Period } | { name: string; type: 'reference'; entity: string; label?: Text };

/** Valor de cada filtro: período, ou o registro escolhido (`{ id, title }`); ausente = sem filtro. */
export type FilterValues = Record<string, Period | { id: string; title?: string | null } | undefined>;

type Rel = { $date: string; offset?: number; unit?: string };
const rel = ($date: string, offset?: number, unit?: string): Rel => ({ $date, ...(offset ? { offset } : {}), ...(unit ? { unit } : {}) });

/** Início (incluso) e fim (excluso) de cada período, como datas relativas; `all` não filtra. */
const RANGES: Record<Exclude<Period, 'all'>, [Rel, Rel]> = {
  today: [rel('today'), rel('today', 1)],
  week: [rel('weekStart'), rel('weekStart', 1, 'week')],
  month: [rel('monthStart'), rel('monthStart', 1, 'month')],
  lastMonth: [rel('monthStart', -1, 'month'), rel('monthStart')],
  last7: [rel('today', -6), rel('today', 1)],
  last30: [rel('today', -29), rel('today', 1)],
  year: [rel('yearStart'), rel('yearStart', 1, 'year')]
};

/** Condição de um período sobre um campo date ou datetime. */
export function periodWhere(field: string, period: Period): Condition | undefined {
  if (period === 'all') return undefined;
  const [from, to] = RANGES[period];
  return {
    and: [
      { field, op: 'gte', value: from },
      { field, op: 'lt', value: to }
    ]
  };
}

/** Valores iniciais: o `default` de cada período; reference começa vazio. */
export function initialValues(filters: DashboardFilter[]): FilterValues {
  return Object.fromEntries(filters.filter((f) => f.type === 'period').map((f) => [f.name, f.default ?? 'all']));
}

/** O widget com os filtros que ele liga (`bind`) somados (e) ao `where` dele. */
export function applyFilters<W extends WidgetDef>(widget: W, filters: DashboardFilter[], values: FilterValues): W {
  const parts: Condition[] = [];
  for (const [name, field] of Object.entries(widget.bind ?? {})) {
    const f = filters.find((x) => x.name === name);
    const v = values[name];
    if (!f || v === undefined) continue;
    const c = f.type === 'period' ? periodWhere(field, v as Period) : { field, op: 'eq' as const, value: (v as { id: string }).id };
    if (c) parts.push(c);
  }
  if (parts.length === 0) return widget;
  const all = widget.where ? [widget.where, ...parts] : parts;
  return { ...widget, where: all.length === 1 ? all[0] : { and: all } };
}

/** Valores na URL (`f.<nome>`, e o título do registro em `ft.<nome>`): voltar e compartilhar mantêm o recorte. */
export function readValues(params: URLSearchParams, filters: DashboardFilter[]): FilterValues {
  const out = initialValues(filters);
  for (const f of filters) {
    const v = params.get(`f.${f.name}`);
    if (v === null) continue;
    if (f.type === 'period') out[f.name] = (PERIODS as readonly string[]).includes(v) ? (v as Period) : out[f.name];
    else out[f.name] = v ? { id: v, title: params.get(`ft.${f.name}`) } : undefined;
  }
  return out;
}
