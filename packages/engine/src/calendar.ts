// Calendário da entidade: período pedido ao backend e registro ↔ evento do FullCalendar. Sem React.

import type { CalendarView, Condition, WireRecord } from './types';

type DateType = 'date' | 'datetime';

const pad = (n: number) => String(n).padStart(2, '0');

/** Dia local no formato trafegado de `date` (YYYY-MM-DD). */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `YYYY-MM` da URL; inválido ou ausente vira o mês de `today`. */
export function parseMonth(value: string | null | undefined, today = new Date()): { year: number; month: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(value ?? '');
  const month = m ? Number(m[2]) - 1 : -1;
  if (!m || month < 0 || month > 11) return { year: today.getFullYear(), month: today.getMonth() };
  return { year: Number(m[1]), month };
}

export function monthParam(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** Limite no formato trafegado do tipo: data local ou instante UTC sem milissegundos. */
function bound(d: Date, type: DateType): string {
  return type === 'date' ? dayKey(d) : d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Registros que tocam [from, to): sem `end`, o início cai no período; com `end`, começa antes do fim do período
 * e termina depois do começo (sem fim preenchido, vale o início).
 */
export function rangeWhere(view: CalendarView, type: DateType, from: Date, to: Date): Condition {
  const lo = bound(from, type);
  const hi = bound(to, type);
  const startsBefore: Condition = { field: view.start, op: 'lt', value: hi };
  const startsAfter: Condition = { field: view.start, op: 'gte', value: lo };
  if (!view.end) return { and: [startsAfter, startsBefore] };
  return {
    and: [
      startsBefore,
      { or: [{ field: view.end, op: 'gte', value: lo }, { and: [{ field: view.end, op: 'null', value: true }, startsAfter] }] }
    ]
  };
}

/** Dia local de um valor `date` ou `datetime`; vazio ou inválido devolve undefined. */
export function valueDay(value: unknown, type: DateType): string | undefined {
  if (typeof value !== 'string' || value === '') return undefined;
  if (type === 'date') return value.slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : dayKey(d);
}

const addDays = (day: string, n: number) => {
  const [y, m, d] = day.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n));
};

/** O evento como o FullCalendar recebe: `end` exclusivo (o `date` da spec guarda o último dia, inclusivo). */
export interface CalendarItem {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
}

/** Registro → evento do calendário. Sem início válido, fica de fora (undefined). */
export function toItem(r: WireRecord, view: CalendarView, type: DateType, title: string): CalendarItem | undefined {
  const start = r[view.start];
  if (typeof start !== 'string' || start === '' || (type === 'datetime' && Number.isNaN(new Date(start).getTime()))) return undefined;
  const rawEnd = view.end ? r[view.end] : undefined;
  const end = typeof rawEnd === 'string' && rawEnd > start ? rawEnd : undefined;
  if (type === 'date') return { id: r.id!, title, start, end: addDays(end ?? start, 1), allDay: true };
  const allDay = Boolean(view.allDay && r[view.allDay]);
  return { id: r.id!, title, start, end, allDay };
}

/** Evento arrastado ou redimensionado → o que gravar, no formato trafegado. `end` null: o calendário não deu fim. */
export function movedPatch(moved: { start: Date; end: Date | null; allDay: boolean }, view: CalendarView, type: DateType): WireRecord {
  const patch: WireRecord = {};
  if (type === 'date') {
    patch[view.start] = dayKey(moved.start);
    if (view.end) patch[view.end] = moved.end ? addDays(dayKey(moved.end), -1) : dayKey(moved.start);
    return patch;
  }
  patch[view.start] = bound(moved.start, type);
  if (view.end) patch[view.end] = moved.end ? bound(moved.end, type) : null;
  if (view.allDay) patch[view.allDay] = moved.allDay;
  return patch;
}
