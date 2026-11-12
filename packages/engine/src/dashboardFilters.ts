// Filtros do painel (app.json pages[].dashboard.filters): o usuário escolhe o período e um registro (a filial, o
// vendedor), e cada widget liga o filtro a um campo dele (`bind`). Sem React: a tela fica em pages/dashboard.

import type { Condition, Text } from './types';
import type { WidgetDef } from './dashboard';

/** Períodos do filtro `period`, resolvidos no backend pelo relógio do sistema (datas relativas). */
export const PERIODS = ['today', 'week', 'month', 'lastMonth', 'last7', 'last30', 'next7', 'next30', 'nextMonth', 'year', 'all'] as const;
export type Period = (typeof PERIODS)[number];

export const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoje',
  week: 'Esta semana',
  month: 'Este mês',
  lastMonth: 'Mês passado',
  last7: 'Últimos 7 dias',
  last30: 'Últimos 30 dias',
  next7: 'Próximos 7 dias',
  next30: 'Próximos 30 dias',
  nextMonth: 'Próximo mês',
  year: 'Este ano',
  all: 'Tudo'
};

export type DashboardFilter =
  | {
      name: string;
      type: 'period';
      label?: Text;
      default?: Period;
      /** Quais períodos o seletor oferece, nesta ordem (vencimentos: só os para a frente). Padrão: todos. */
      options?: Period[];
    }
  | { name: string; type: 'reference'; entity: string; label?: Text };

/** Períodos que o filtro oferece. */
export const periodOptions = (f: { options?: Period[] }): readonly Period[] => (f.options?.length ? f.options : PERIODS);

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
  // para a frente (vencimentos): de hoje até hoje+N−1
  next7: [rel('today'), rel('today', 7)],
  next30: [rel('today'), rel('today', 30)],
  nextMonth: [rel('monthStart', 1, 'month'), rel('monthStart', 2, 'month')],
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

/** Valores iniciais: o `default` de cada período (sem ele, Tudo, ou o primeiro oferecido); reference começa vazio. */
export function initialValues(filters: DashboardFilter[]): FilterValues {
  return Object.fromEntries(
    filters.flatMap((f) => {
      if (f.type !== 'period') return [];
      const offered = periodOptions(f);
      return [[f.name, f.default ?? (offered.includes('all') ? 'all' : offered[0])]];
    })
  );
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
  const join = (where?: Condition): Condition => {
    const all = where ? [where, ...parts] : parts;
    return all.length === 1 ? all[0] : { and: all };
  };
  // lista com abas (#64): cada aba tem o seu filtro, e o do painel entra em todas
  if (widget.type === 'list' && widget.tabs) return { ...widget, tabs: widget.tabs.map((t) => ({ ...t, where: join(t.where) })) };
  return { ...widget, where: join(widget.where) };
}

/** Valores na URL (`f.<nome>`, e o título do registro em `ft.<nome>`): voltar e compartilhar mantêm o recorte. */
export function readValues(params: URLSearchParams, filters: DashboardFilter[]): FilterValues {
  const out = initialValues(filters);
  for (const f of filters) {
    const v = params.get(`f.${f.name}`);
    if (v === null) continue;
    if (f.type === 'period') out[f.name] = (periodOptions(f) as readonly string[]).includes(v) ? (v as Period) : out[f.name];
    else out[f.name] = v ? { id: v, title: params.get(`ft.${f.name}`) } : undefined;
  }
  return out;
}
