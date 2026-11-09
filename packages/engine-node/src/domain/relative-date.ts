// Datas relativas em condições de filtro (`where` da lista e do `_aggregate`, presets, widgets do painel):
// `{"$date": "monthStart"}` e `{"$now": true, "offset": -24, "unit": "hour"}` viram o valor trafegado na hora da
// consulta, pelo relógio do sistema (`Hooks.clock`). Assim o SQL, a contagem e os totais usam o mesmo "hoje".

import { type Entity, readableField } from './entity';
import { type Rec, isObject } from './types';

const DAY = 86_400;
const OPS = ['eq', 'ne', 'lt', 'lte', 'gt', 'gte'];

/** O relógio das datas relativas. `today` é o dia operacional do sistema; sem ele, a data de `now` no fuso. */
export interface Clock {
  /** Agora, em segundos desde 1970-01-01 UTC. */
  now: number;
  /** Fuso do sistema em minutos a partir do UTC (Brasília: -180). */
  utcOffsetMinutes: number;
  /** `YYYY-MM-DD`; ausente = a data de `now` no fuso. */
  today?: string;
}

export const systemClock = (): Clock => ({ now: Math.floor(Date.now() / 1000), utcOffsetMinutes: 0 });

const mod = (a: number, b: number): number => ((a % b) + b) % b;
const fdiv = (a: number, b: number): number => Math.floor(a / b);

function todayDays(c: Clock): number {
  if (c.today === undefined) return fdiv(c.now + c.utcOffsetMinutes * 60, DAY);
  const d = parseDate(c.today);
  if (d === undefined) throw new Error(`Hooks.clock devolveu today inválido '${c.today}'`);
  return d;
}

export const isRelative = (v: Rec): boolean => '$date' in v || '$now' in v;

/** Copia a condição trocando cada valor relativo pelo valor trafegado do campo (date ou datetime). */
export function resolveRelative(cond: unknown, entity: Entity, clock: Clock): unknown {
  if (!isObject(cond)) return cond;
  const out: Rec = {};
  for (const [k, v] of Object.entries(cond)) {
    if ((k === 'and' || k === 'or') && Array.isArray(v)) out[k] = v.map((c) => resolveRelative(c, entity, clock));
    else if (k === 'not') out[k] = resolveRelative(v, entity, clock);
    else if (k === 'value' && isObject(v) && isRelative(v)) out[k] = leaf(cond, v, entity, clock);
    else out[k] = v;
  }
  return out;
}

function leaf(obj: Rec, rel: Rec, entity: Entity, clock: Clock): string {
  const name = typeof obj.field === 'string' ? obj.field : '';
  const type = readableField(entity, name)?.type;
  const op = typeof obj.op === 'string' ? obj.op : '';
  if (!OPS.includes(op)) throw new Error(`data relativa em '${name}' só vale com eq, ne, lt, lte, gt e gte`);
  if (type !== 'date' && type !== 'datetime') throw new Error(`data relativa só vale em campo date ou datetime ('${name}')`);
  try {
    return relativeValue(rel, type === 'datetime', clock);
  } catch (e) {
    throw new Error(`'${name}': ${(e as Error).message}`, { cause: e });
  }
}

/** O valor trafegado de `{"$date": ...}` ou `{"$now": true}` para um campo date (ou datetime). */
export function relativeValue(rel: Rec, datetime: boolean, clock: Clock): string {
  const extra = Object.keys(rel).find((k) => !['$date', '$now', 'offset', 'unit'].includes(k));
  if (extra !== undefined) throw new Error(`data relativa com chave desconhecida '${extra}'`);
  const offset = rel.offset ?? 0;
  if (typeof offset !== 'number' || !Number.isInteger(offset)) throw new Error("'offset' precisa ser inteiro");
  if (rel.unit !== undefined && typeof rel.unit !== 'string') throw new Error("'unit' precisa ser texto");
  const unit = rel.unit as string | undefined;
  if ('$now' in rel) {
    if ('$date' in rel || rel.$now !== true) throw new Error('use {"$now": true} ou {"$date": ...}, não os dois');
    if (!datetime) throw new Error("'$now' só vale em campo datetime; em date, use '$date'");
    const step = { minute: 60, hour: 3_600, day: DAY }[unit ?? 'hour'];
    if (step === undefined) throw new Error(`'unit' de '$now' precisa ser minute, hour ou day (veio '${unit as string}')`);
    return formatDatetime(clock.now + offset * step);
  }
  const today = todayDays(clock);
  let base: number;
  switch (rel.$date) {
    case 'today':
      base = today;
      break;
    case 'weekStart':
      base = today - mod(today + 3, 7); // 1970-01-01 foi quinta; semana começa na segunda
      break;
    case 'monthStart': {
      const [y, m] = civil(today);
      base = days(y, m, 1);
      break;
    }
    case 'yearStart':
      base = days(civil(today)[0], 1, 1);
      break;
    default:
      throw new Error("'$date' precisa ser today, weekStart, monthStart ou yearStart");
  }
  let day: number;
  switch (unit ?? 'day') {
    case 'day':
      day = base + offset;
      break;
    case 'week':
      day = base + offset * 7;
      break;
    case 'month':
      day = addMonths(base, offset);
      break;
    case 'year':
      day = addMonths(base, offset * 12);
      break;
    default:
      throw new Error(`'unit' de '$date' precisa ser day, week, month ou year (veio '${unit as string}')`);
  }
  return datetime ? formatDatetime(day * DAY - clock.utcOffsetMinutes * 60) : formatDate(day);
}

/** Soma meses mantendo o dia, ou o último do mês quando ele não existe (31/01 + 1 mês = 28/02). */
function addMonths(day: number, n: number): number {
  const [y0, m0, d] = civil(day);
  const total = y0 * 12 + (m0 - 1) + n;
  const [y, m] = [fdiv(total, 12), mod(total, 12) + 1];
  const last = days(y + fdiv(m, 12), (m % 12) + 1, 1) - days(y, m, 1);
  return days(y, m, Math.min(d, last));
}

/** Dias desde 1970-01-01 (algoritmo de Howard Hinnant, calendário gregoriano proléptico). */
function days(y0: number, m: number, d: number): number {
  const y = m <= 2 ? y0 - 1 : y0;
  const era = fdiv(y, 400);
  const yoe = y - era * 400;
  const doy = Math.trunc((153 * ((m + 9) % 12) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.trunc(yoe / 4) - Math.trunc(yoe / 100) + doy;
  return era * 146_097 + doe - 719_468;
}

function civil(z0: number): [number, number, number] {
  const z = z0 + 719_468;
  const era = fdiv(z, 146_097);
  const doe = z - era * 146_097;
  const t = Math.trunc;
  const yoe = t((doe - t(doe / 1460) + t(doe / 36_524) - t(doe / 146_096)) / 365);
  const doy = doe - (365 * yoe + t(yoe / 4) - t(yoe / 100));
  const mp = t((5 * doy + 2) / 153);
  const d = doy - t((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  return [yoe + era * 400 + (m <= 2 ? 1 : 0), m, d];
}

function parseDate(s: string): number | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return undefined;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const z = days(y, mo, d);
  const [cy, cm, cd] = civil(z);
  return cy === y && cm === mo && cd === d ? z : undefined;
}

const pad = (n: number, w = 2): string => String(n).padStart(w, '0');

function formatDate(day: number): string {
  const [y, m, d] = civil(day);
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

function formatDatetime(secs: number): string {
  const rem = mod(secs, DAY);
  return `${formatDate(fdiv(secs, DAY))}T${pad(Math.trunc(rem / 3_600))}:${pad(Math.trunc((rem % 3_600) / 60))}:${pad(rem % 60)}Z`;
}
