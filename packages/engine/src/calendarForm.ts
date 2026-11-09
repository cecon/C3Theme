// Formulário de uma entidade com calendário (views.calendar com `allDay`): com o dia inteiro ligado, início e fim
// são editados só como data, e o fim aparece inclusivo (o último dia), como na tela; no fio ele é exclusivo.

import { datetimeToLocalInput, localInputToDatetime } from './format';
import type { EntityDef, WireRecord } from './types';

const local = (iso: string) => datetimeToLocalInput(iso).slice(0, 10);
const at = (day: string, hhmm = '00:00') => localInputToDatetime(`${day}T${hhmm}`);
const shift = (day: string, n: number) => {
  const [y, m, d] = day.split('-').map(Number);
  return local(new Date(y, m - 1, d + n, 12).toISOString());
};

/** 'start' ou 'end' quando o campo datetime é o início ou o fim do calendário que tem dia inteiro. */
export function allDayRole(def: EntityDef, name: string): 'start' | 'end' | undefined {
  const cal = def.views?.calendar;
  if (!cal?.allDay || def.fields.find((f) => f.name === name)?.type !== 'datetime') return undefined;
  return name === cal.start ? 'start' : name === cal.end ? 'end' : undefined;
}

/** O dia inteiro está ligado no registro. */
export const isAllDay = (def: EntityDef, record: WireRecord) => Boolean(def.views?.calendar?.allDay && record[def.views.calendar.allDay]);

/** Datetime do fio → dia mostrado; o fim exclusivo vira o último dia (fim 06/11 00:00 → 05/11). */
export function toDay(iso: unknown, role: 'start' | 'end'): string | null {
  if (typeof iso !== 'string' || !iso) return null;
  return role === 'end' ? local(new Date(Date.parse(iso) - 1).toISOString()) : local(iso);
}

/** Dia escolhido → datetime do fio, à meia-noite local; o fim volta a ser exclusivo (o dia seguinte). */
export function fromDay(day: string | null, role: 'start' | 'end'): string | null {
  if (!day) return null;
  return at(role === 'end' ? shift(day, 1) : day);
}

/**
 * Ao ligar o dia inteiro, início e fim vão para a meia-noite dos dias que o evento já ocupava; ao desligar, o
 * evento vira das 9h às 10h do dia do início, como a tela do calendário sugere.
 */
export function allDayPatch(def: EntityDef, record: WireRecord, name: string, value: unknown): WireRecord {
  const cal = def.views?.calendar;
  if (!cal?.allDay || name !== cal.allDay || !cal.end || typeof record[cal.start] !== 'string') return {};
  const start = local(record[cal.start] as string);
  if (!value)
    return {
      [cal.start]: at(start, '09:00'),
      [cal.end]: new Date(Date.parse(at(start, '09:00')) + 3_600_000).toISOString().replace(/\.\d{3}Z$/, 'Z')
    };
  const end = typeof record[cal.end] === 'string' ? toDay(record[cal.end], 'end')! : start;
  const last = end < start ? start : end;
  return { [cal.start]: at(start), [cal.end]: fromDay(last, 'end') };
}
