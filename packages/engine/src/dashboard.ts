// Painel por JSON (app.json pages[].dashboard): tipos dos widgets e a lógica sem React. As telas ficam em pages/dashboard.

import { formatAmount } from './format';
import type { Condition, EntityDef, FieldDef, Text, Tone } from './types';
import type { DashboardFilter } from './dashboardFilters';
import type { SummarySource, SummaryWidget } from './summary';
import { viewPath } from './views';

export type Measure = 'count' | `sum:${string}`;
export type Interval = 'day' | 'month' | 'year';

interface WidgetBase {
  title: Text;
  entity: string;
  preset?: string;
  where?: Condition;
  width?: number;
  /** Filtros do painel que valem para o widget: nome do filtro → campo da entidade. */
  bind?: Record<string, string>;
}
export interface KpiWidget extends WidgetBase {
  type: 'kpi';
  measure?: Measure;
  /** Ícone do catálogo num quadrado com a cor `tone`, à esquerda do título e do valor. */
  icon?: string;
  tone?: Tone;
  /** Mostra quantos registros o valor soma ("25 faturas"), com o nome da entidade. */
  count?: boolean;
  /** Barra de progresso: `part` (somado ao filtro do widget) sobre `whole` (ausente: o próprio widget), com o rótulo. */
  progress?: { label: Text; part?: Condition; whole?: Condition };
  /** Variação sobre outro recorte (preset e where no lugar dos do widget), com a seta e a cor; `invert`: subir é ruim. */
  compare?: { label: Text; preset?: string; where?: Condition; invert?: boolean };
}
export interface ChartWidget extends WidgetBase {
  type: 'chart';
  groupBy: string;
  measure?: Measure;
  interval?: Interval;
  /** `area`: linhas suaves com área, uma por série, com legenda; `donut`: rosca com a legenda ao lado (%, valor). */
  chart?: 'bar' | 'line' | 'area' | 'donut';
  subtitle?: Text;
  /** Várias séries no mesmo eixo (faturado x recebido): cada uma com seu filtro (somado ao do widget) e cor. */
  series?: { label: Text; where?: Condition; measure?: Measure; tone?: Tone }[];
  /** Escolha dos últimos N períodos no cabeçalho ("6 meses", "12 meses"), na ordem declarada; o maior é o padrão. */
  ranges?: number[];
  /** Texto do gráfico sem dados. Padrão: "Nenhum registro." (e o do idioma da shell dentro do gráfico). */
  empty?: Text;
  /** Só em `area`: o eixo mostra o valor dividido por este número (1000 = em mil; diga a unidade no `subtitle`). */
  axisScale?: number;
}
/** Ranking: os maiores grupos (cliente que mais deve) com avatar, a contagem e um destaque condicional. */
export interface RankingWidget extends WidgetBase {
  type: 'ranking';
  groupBy: string;
  measure?: Measure;
  subtitle?: Text;
  limit?: number;
  /** Segunda linha do grupo: `{count}` vira a quantidade e `{label}` o nome da entidade, no singular ou plural. */
  caption?: Text;
  /** Parte do grupo que pede atenção (vencidas): chip com `{value}` e cor; sem ela, `otherwise`. */
  flag?: { where: Condition; label: Text; tone?: Tone; otherwise?: { label: Text; tone?: Tone } };
  /** Ação de registro da entidade do grupo (o reference do `groupBy`), num botão em cada linha ("Cobrar"). */
  action?: string;
}
/** Avisos recentes: ícone e cor pelo enum `kind`, título, texto e há quanto tempo (campo `time`). */
export interface FeedWidget extends WidgetBase {
  type: 'feed';
  kind: string;
  text?: string;
  time: string;
  /** Ícone do catálogo por valor do enum `kind`. */
  icons?: Record<string, string>;
  limit?: number;
}
export interface ListWidget extends WidgetBase {
  type: 'list';
  columns?: string[];
  sort?: string;
  /** Até 200 (`LIST_MAX`); acima de 10 linhas o cartão rola por dentro, com o cabeçalho fixo. */
  limit?: number;
  /** Abas, cada uma com a sua entidade e filtro (A receber / A pagar); colunas, ordem e limite vêm do widget. */
  tabs?: ListTab[];
  /** Campo enum ou boolean: um seletor no cartão filtra a lista sem sair do painel. */
  filter?: string;
}
export interface ListTab {
  label: Text;
  entity?: string;
  preset?: string;
  where?: Condition;
  columns?: string[];
  sort?: string;
}
/** Aviso: aparece só quando a contagem passa de zero, e leva à lista com o mesmo recorte. */
export interface AlertWidget extends WidgetBase {
  type: 'alert';
  /** Texto com `{count}` e, com `measure`, `{value}` (ex.: "{count} títulos vencendo, {value}"). */
  text: Text;
  /** Soma mostrada em `{value}`, no formato do campo (`sum:valor`). */
  measure?: Measure;
  tone?: 'info' | 'warning' | 'error';
}
/** Grade de atividade: uma coluna por semana, uma linha por dia da semana, mais forte quanto maior o valor do dia. */
export interface HeatmapWidget extends WidgetBase {
  type: 'heatmap';
  /** Campo date ou datetime. */
  groupBy: string;
  measure?: Measure;
  subtitle?: Text;
  /** Cor das células (padrão `success`). */
  tone?: Tone;
  empty?: Text;
}
/** Widget que lê entidade (`GET /{entity}/_aggregate` ou a lista). */
export type EntityWidget = KpiWidget | ChartWidget | ListWidget | AlertWidget | RankingWidget | FeedWidget | HeatmapWidget;
export type WidgetDef = EntityWidget | SummaryWidget;
export interface DashboardDef {
  /** Resumo que o sistema calcula (GET), lido pelos widgets `meter`, `share` e `status` (#108). */
  source?: SummarySource;
  /** Filtros que valem para os widgets que os ligam (`bind`). */
  filters?: DashboardFilter[];
  /** Botões no topo, à direita (atalhos para a lista e para criar). */
  actions?: { label: Text; path: string; icon?: string; variant?: 'contained' | 'outlined' }[];
  widgets: WidgetDef[];
}

/** Um grupo de GET /{entity}/_aggregate. `value` de soma de decimal vem em string, como o campo. */
export interface AggregateItem {
  key: string | number | boolean | null;
  title?: string | null;
  value: number | string;
  /** Só com mais de uma medida: todas, na ordem pedida. */
  values?: (number | string)[];
}

export interface AggregateParams {
  /** Várias medidas vão numa chamada só (totais da lista). */
  measure?: Measure | Measure[];
  groupBy?: string;
  interval?: Interval;
  where?: Condition;
  q?: string;
  branches?: string[];
  params?: Record<string, string>;
}

const DEFAULT_WIDTH = { kpi: 3, chart: 6, list: 6, alert: 12, ranking: 6, feed: 6, heatmap: 12, meter: 6, share: 6, status: 6 } as const;

export function widgetWidth(w: WidgetDef): number {
  return w.width ?? DEFAULT_WIDTH[w.type];
}

/** Filtro do widget: o do preset somado (e) ao `where`. */
export function widgetWhere(w: EntityWidget, def: EntityDef): Condition | undefined {
  const preset = def.views?.list?.presets?.find((p) => p.id === w.preset)?.where;
  if (preset && w.where) return { and: [preset, w.where] };
  return preset ?? w.where;
}

/**
 * Lista com o recorte do widget: o preset e, quando há `where` (do widget ou dos filtros do painel), ele em `w` na URL,
 * que a lista soma ao filtro e mostra como "Filtro do painel".
 */
export function widgetLink(w: EntityWidget): string {
  const base = viewPath(w.entity, 'list', w.preset);
  if (!w.where) return base;
  return `${base}${base.includes('?') ? '&' : '?'}w=${encodeURIComponent(JSON.stringify(w.where))}`;
}

/** Campo somado (`sum:<campo>`); `count` não tem. */
export function measureField(def: EntityDef, measure?: Measure): FieldDef | undefined {
  const name = measure?.startsWith('sum:') ? measure.slice(4) : undefined;
  return name ? def.fields.find((f) => f.name === name) : undefined;
}

/** Valor agregado como número (para o eixo do gráfico). */
export function measureNumber(v: number | string): number {
  return typeof v === 'number' ? v : Number(v);
}

/** Valor agregado como texto, no formato do campo somado (decimal com a escala dele; dinheiro com o símbolo). */
export function formatMeasure(v: number | string, field: FieldDef | undefined, locale: string): string {
  if (field?.type === 'decimal') return formatAmount(String(v), field, locale);
  return measureNumber(v).toLocaleString(locale);
}

export const isDateField = (f?: FieldDef) => f?.type === 'date' || f?.type === 'datetime';

/** `line` só faz sentido no tempo; o padrão segue o tipo do campo agrupado. */
export function chartKind(w: ChartWidget, field?: FieldDef): NonNullable<ChartWidget['chart']> {
  return w.chart ?? (isDateField(field) ? 'line' : 'bar');
}

/** Próximo período de uma key de data (`2026`, `2026-10`, `2026-10-30`). */
function nextKey(key: string, interval: Interval): string {
  if (interval === 'year') return String(Number(key) + 1);
  if (interval === 'month') {
    const [y, m] = key.split('-').map(Number);
    return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  }
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Os `n` períodos que terminam em `last` (inclusive), do mais antigo ao mais novo. */
export function periodsUntil(last: string, n: number, interval: Interval): string[] {
  const keys = [last];
  while (keys.length < n) keys.unshift(prevKey(keys[0], interval));
  return keys;
}

function prevKey(key: string, interval: Interval): string {
  if (interval === 'year') return String(Number(key) - 1);
  if (interval === 'month') {
    const [y, m] = key.split('-').map(Number);
    return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  }
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Pontos máximos ao completar o tempo: acima disso, o gráfico mostra só os períodos que vieram. */
export const MAX_FILLED = 400;

/**
 * Agrupamento por data: os períodos sem registro entram com zero (uma linha que pula meses engana) e o grupo vazio
 * (sem data) sai, porque não tem lugar no eixo do tempo.
 */
export function fillTimeline(items: AggregateItem[], interval: Interval, zero: number | string): AggregateItem[] {
  const dated = items.filter((i) => typeof i.key === 'string');
  if (dated.length < 2) return dated;
  const byKey = new Map(dated.map((i) => [i.key as string, i]));
  const out: AggregateItem[] = [];
  const last = dated[dated.length - 1].key as string;
  for (let k = dated[0].key as string; out.length <= MAX_FILLED; k = nextKey(k, interval)) {
    out.push(byKey.get(k) ?? { key: k, value: zero });
    if (k >= last) return out;
  }
  return dated;
}

/** Enum na ordem de options (o painel lê como o formulário); o resto como veio (maiores primeiro). */
export function orderGroups(items: AggregateItem[], field?: FieldDef): AggregateItem[] {
  if (field?.type !== 'enum') return items;
  const pos = (k: AggregateItem['key']) => {
    const i = (field.options ?? []).findIndex((o) => o.value === k);
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...items].sort((a, b) => pos(a.key) - pos(b.key));
}

/** Rótulo de uma key de data no eixo: ano, mês abreviado ou dia. */
export function periodLabel(key: string, interval: Interval, locale: string): string {
  if (interval === 'year') return key;
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d || 1);
  return interval === 'month'
    ? date.toLocaleDateString(locale, { month: 'short', year: '2-digit' })
    : date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
}

/** Os dois filtros juntos (e); um só, ele mesmo. */
export function bothWhere(a?: Condition, b?: Condition): Condition | undefined {
  return a && b ? { and: [a, b] } : (a ?? b);
}

/** Parte sobre o todo em %, 0 sem todo; nunca passa de 100. */
export function share(part: number, whole: number): number {
  return whole > 0 ? Math.min(100, (part / whole) * 100) : 0;
}

/** Texto do aviso: `{count}` vira a contagem e `{value}` a soma de `measure`, no formato do campo somado (#64). */
export function alertText(template: string, w: AlertWidget, def: EntityDef, item: AggregateItem | undefined, locale: string): string {
  const count = Number(item?.values?.[0] ?? item?.value ?? 0);
  const sum = w.measure ? (item?.values?.[1] ?? 0) : undefined;
  const out = template.replace('{count}', count.toLocaleString(locale));
  return sum === undefined ? out : out.replace('{value}', formatMeasure(sum, measureField(def, w.measure), locale));
}
