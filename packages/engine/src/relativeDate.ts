// Data relativa (spec/README.md, "Data relativa"): filtros do adaptador em memória e valores iniciais do formulário.
// Mesmas regras do c3-engine (crates/c3-engine/src/relative_date.rs); os dois rodam
// spec/v0/conformance/relative-dates.json.

import type { Condition, EntityDef, FieldDef } from './types';

/** Relógio das datas relativas: instante, fuso do sistema em minutos (Brasília: -180) e dia operacional opcional. */
export interface Clock {
  now: Date;
  utcOffsetMinutes: number;
  today?: string;
}

const DAY = 86_400_000;
const OPS = new Set(['eq', 'ne', 'lt', 'lte', 'gt', 'gte']);
const KEYS = new Set(['$date', '$now', 'offset', 'unit']);

/** Relógio do navegador: fuso local. */
export const browserClock = (now: Date): Clock => ({ now, utcOffsetMinutes: -now.getTimezoneOffset() });

const dateOf = (days: number) => new Date(days * DAY).toISOString().slice(0, 10);
const daysOf = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d) / DAY;
const isoInstant = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');

/** `YYYY-MM-DD` em dias desde 1970; data que não existe (30/02) é undefined. */
function parseDay(s: string): number | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return undefined;
  const days = daysOf(+m[1], +m[2], +m[3]);
  return dateOf(days) === s ? days : undefined;
}

/** Soma meses mantendo o dia, ou o último do mês quando ele não existe (31/01 + 1 mês = 28/02). */
function addMonths(days: number, n: number): number {
  const d = new Date(days * DAY);
  const total = d.getUTCFullYear() * 12 + d.getUTCMonth() + n;
  const y = Math.floor(total / 12);
  const m = total - y * 12 + 1;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return daysOf(y, m, Math.min(d.getUTCDate(), last));
}

function todayDays(clock: Clock): number {
  if (clock.today === undefined) return Math.floor((clock.now.getTime() + clock.utcOffsetMinutes * 60_000) / DAY);
  const t = parseDay(clock.today);
  if (t === undefined) throw new Error(`today do relógio inválido '${clock.today}'`);
  return t;
}

/** O valor trafegado de `{"$date": ...}` ou `{"$now": true}` para um campo date (ou datetime). */
export function relativeValue(rel: Record<string, unknown>, datetime: boolean, clock: Clock): string {
  const extra = Object.keys(rel).find((k) => !KEYS.has(k));
  if (extra) throw new Error(`data relativa com chave desconhecida '${extra}'`);
  const offset = rel.offset ?? 0;
  if (!Number.isInteger(offset)) throw new Error("'offset' precisa ser inteiro");
  const n = offset as number;
  if (rel.unit !== undefined && typeof rel.unit !== 'string') throw new Error("'unit' precisa ser texto");
  if ('$now' in rel) {
    if ('$date' in rel || rel.$now !== true) throw new Error('use {"$now": true} ou {"$date": ...}, não os dois');
    if (!datetime) throw new Error("'$now' só vale em campo datetime; em date, use '$date'");
    const step = { minute: 60_000, hour: 3_600_000, day: DAY }[(rel.unit as string) ?? 'hour'];
    if (!step) throw new Error("'unit' de '$now' precisa ser minute, hour ou day");
    return isoInstant(clock.now.getTime() + n * step);
  }
  const today = todayDays(clock);
  const t = new Date(today * DAY);
  const base = {
    today,
    weekStart: today - ((t.getUTCDay() + 6) % 7), // semana começa na segunda
    monthStart: daysOf(t.getUTCFullYear(), t.getUTCMonth() + 1, 1),
    yearStart: daysOf(t.getUTCFullYear(), 1, 1)
  }[rel.$date as string];
  if (base === undefined) throw new Error("'$date' precisa ser today, weekStart, monthStart ou yearStart");
  const unit = (rel.unit as string) ?? 'day';
  const day =
    unit === 'day'
      ? base + n
      : unit === 'week'
        ? base + n * 7
        : unit === 'month'
          ? addMonths(base, n)
          : unit === 'year'
            ? addMonths(base, n * 12)
            : NaN;
  if (Number.isNaN(day)) throw new Error("'unit' de '$date' precisa ser day, week, month ou year");
  return datetime ? isoInstant(day * DAY - clock.utcOffsetMinutes * 60_000) : dateOf(day);
}

const isRelative = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v) && ('$date' in v || '$now' in v);

/** Valor relativo numa folha da condição, conferido contra o tipo do campo e o operador. */
export function resolveLeaf(field: FieldDef | undefined, op: string, value: Record<string, unknown>, clock: Clock): string {
  const name = field?.name ?? '?';
  if (!OPS.has(op)) throw new Error(`data relativa em '${name}' só vale com eq, ne, lt, lte, gt e gte`);
  if (field?.type !== 'date' && field?.type !== 'datetime') throw new Error(`data relativa só vale em campo date ou datetime ('${name}')`);
  return relativeValue(value, field.type === 'datetime', clock);
}

/** Troca cada data relativa da condição pelo valor trafegado, pelo relógio `clock`. */
export function resolveDates(cond: Condition | undefined, def: EntityDef, clock: Clock): Condition | undefined {
  if (!cond) return cond;
  if ('and' in cond) return { and: cond.and.map((c) => resolveDates(c, def, clock)!) };
  if ('or' in cond) return { or: cond.or.map((c) => resolveDates(c, def, clock)!) };
  if ('not' in cond) return { not: resolveDates(cond.not, def, clock)! };
  if (!isRelative(cond.value)) return cond;
  return {
    ...cond,
    value: resolveLeaf(
      def.fields.find((f) => f.name === cond.field),
      cond.op,
      cond.value,
      clock
    )
  };
}
