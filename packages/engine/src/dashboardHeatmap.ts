// Grade de atividade do painel (widget `heatmap`) sem React: os dias da grade, a força de cada um e o recorte do clique.

import type { AggregateItem } from './dashboard';
import { measureNumber } from './dashboard';
import type { Condition } from './types';

export interface HeatCell {
  /** Dia local, `AAAA-MM-DD`. */
  day: string;
  value: number;
  /** O valor como veio (soma de decimal em texto), para o rótulo. */
  raw: number | string;
  /** 0 sem registro; 1 a 4, do mais claro ao mais forte. */
  level: number;
}

const pad = (n: number) => String(n).padStart(2, '0');
const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Força de 1 a 4 sobre o maior valor; zero fica 0. */
export function heatLevel(value: number, max: number): number {
  return value > 0 && max > 0 ? Math.min(4, Math.ceil((value / max) * 4)) : 0;
}

/**
 * Dias que a grade mostra: com os dados num ano só (ou sem dados, no ano de `today`), janeiro a dezembro; senão, do
 * primeiro ao último dia que veio. Semanas de domingo a sábado: `null` é o dia fora do intervalo, que só completa a
 * primeira e a última coluna.
 */
export function heatmapWeeks(items: AggregateItem[], today: Date = new Date()): (HeatCell | null)[][] {
  const dated = items.filter((i) => typeof i.key === 'string').map((i) => ({ day: String(i.key).slice(0, 10), raw: i.value }));
  const years = new Set(dated.map((d) => d.day.slice(0, 4)));
  const year = years.size <= 1 ? Number([...years][0] ?? today.getFullYear()) : undefined;
  const sorted = dated.map((d) => d.day).sort();
  const first = year ? new Date(year, 0, 1) : parse(sorted[0]);
  const last = year ? new Date(year, 11, 31) : parse(sorted[sorted.length - 1]);
  const byDay = new Map(dated.map((d) => [d.day, d.raw]));
  const max = Math.max(0, ...dated.map((d) => measureNumber(d.raw)));

  const weeks: (HeatCell | null)[][] = [];
  const d = new Date(first);
  d.setDate(d.getDate() - d.getDay());
  while (d <= last) {
    const week: (HeatCell | null)[] = [];
    for (let i = 0; i < 7; i++, d.setDate(d.getDate() + 1)) {
      if (d < first || d > last) {
        week.push(null);
        continue;
      }
      const day = key(d);
      const raw = byDay.get(day) ?? 0;
      const value = measureNumber(raw);
      week.push({ day, value, raw, level: heatLevel(value, max) });
    }
    weeks.push(week);
  }
  return weeks;
}

/** Recorte do dia clicado: o próprio dia em `date`; em `datetime`, da meia-noite local à seguinte (instante UTC). */
export function dayWhere(field: string, type: 'date' | 'datetime', day: string): Condition {
  if (type === 'date') return { field, op: 'eq', value: day };
  const from = parse(day);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  const utc = (x: Date) => x.toISOString().replace(/\.\d{3}Z$/, 'Z');
  return {
    and: [
      { field, op: 'gte', value: utc(from) },
      { field, op: 'lt', value: utc(to) }
    ]
  };
}
