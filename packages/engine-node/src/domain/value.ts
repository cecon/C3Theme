// Conversão entre o formato trafegado (spec/README.md#tipos-de-campo-e-formato-trafegado) e as colunas SQLite.
//
// Convenção de armazenamento (a mesma do c3-engine em Rust): integer, boolean (0/1), reference e id em INTEGER;
// decimal em INTEGER escalado por 10^scale; o resto em TEXT.

import { checkFile } from './file';
import type { Field } from './field';
import { MAX_SAFE_INTEGER, type SqlValue, asInt, isTextual } from './types';

const DECIMAL = /^(-?)(\d+)(?:\.(\d+))?$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/u;

/** Vazio no sentido da spec: `null`, ausente ou `""`. */
export const isEmpty = (v: unknown): boolean => v === undefined || v === null || v === '';

/** Código de erro de campo (spec: Error.fields[].code) quando o valor não tem o formato do tipo. */
export type FormatError = 'invalid_type' | 'invalid_option' | 'too_large' | 'file_type';

export type Converted = { ok: true; value: SqlValue } | { ok: false; error: FormatError };

const ok = (value: SqlValue): Converted => ({ ok: true, value });
const fail = (error: FormatError): Converted => ({ ok: false, error });

export function toSql(field: Field, v: unknown): Converted {
  if (isEmpty(v)) return ok(null);
  switch (field.type) {
    case 'string':
    case 'text':
    case 'email':
      return typeof v === 'string' ? ok(v) : fail('invalid_type');
    case 'enum': {
      const intCol = isIntColumn(field);
      let option: SqlValue;
      if (typeof v === 'string' && !intCol) option = v;
      else if (typeof v === 'number' && intCol && asInt(v) !== undefined) option = v;
      else return fail('invalid_type');
      return field.options.includes(option) ? ok(option) : fail('invalid_option');
    }
    case 'flags': {
      const n = asInt(v);
      if (n === undefined || n < 0) return fail('invalid_type');
      const all = field.options.reduce<number>((acc, o) => acc | (typeof o === 'number' ? o : 0), 0);
      // bits até 2^30: cabem nas operações de bit do JavaScript
      return n <= 0x7fffffff && (n & ~all) === 0 ? ok(n) : fail('invalid_option');
    }
    case 'integer': {
      const n = asInt(v);
      return n === undefined ? fail('invalid_type') : ok(n);
    }
    case 'boolean':
      return typeof v === 'boolean' ? ok(v ? 1 : 0) : fail('invalid_type');
    case 'decimal': {
      const n = typeof v === 'string' ? parseDecimal(v, field.scale) : undefined;
      return n === undefined ? fail('invalid_type') : ok(n);
    }
    case 'date':
      return typeof v === 'string' && validDate(v) ? ok(v) : fail('invalid_type');
    case 'datetime':
      return typeof v === 'string' && validDatetime(v) ? ok(v) : fail('invalid_type');
    case 'reference': {
      const id = typeof v === 'string' ? parseId(v) : undefined;
      return id === undefined ? fail('invalid_type') : ok(id);
    }
    case 'file': {
      // não vai ao banco pelo motor: o input de ação chega ao sistema como veio, e na entidade grava o sistema
      const err = checkFile(field, v);
      return err ? fail(err) : ok(null);
    }
  }
}

/** Id da URL ou do corpo: inteiro positivo, sem sinal nem zero à esquerda. */
export function parseId(s: string): number | undefined {
  if (!/^[1-9]\d*$/.test(s)) return undefined;
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : undefined;
}

/** `"1234.5"` com scale 2 vira 123450. Mais casas que `scale` é erro, não arredondamento. */
export function parseDecimal(s: string, scale: number): number | undefined {
  const m = DECIMAL.exec(s);
  if (!m) return undefined;
  const frac = (m[3] ?? '').replace(/0+$/, '');
  if (frac.length > scale) return undefined;
  const digits = BigInt(m[2] + frac.padEnd(scale, '0'));
  const n = m[1] === '-' ? -digits : digits;
  if (n > BigInt(MAX_SAFE_INTEGER) || n < -BigInt(MAX_SAFE_INTEGER)) return undefined;
  return Number(n);
}

export function formatDecimal(n: number, scale: number): string {
  if (scale === 0) return String(n);
  const big = BigInt(n);
  const abs = big < 0n ? -big : big;
  const factor = 10n ** BigInt(scale);
  const sign = big < 0n ? '-' : '';
  return `${sign}${abs / factor}.${String(abs % factor).padStart(scale, '0')}`;
}

function daysInMonth(y: number, m: number): number {
  if (m === 2) return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

const validYmd = (y: string, m: string, d: string): boolean => {
  const [yy, mm, dd] = [Number(y), Number(m), Number(d)];
  return mm >= 1 && mm <= 12 && dd >= 1 && dd <= daysInMonth(yy, mm);
};

export function validDate(s: string): boolean {
  const c = DATE.exec(s);
  return !!c && validYmd(c[1], c[2], c[3]);
}

export function validDatetime(s: string): boolean {
  const c = DATETIME.exec(s);
  return !!c && validYmd(c[1], c[2], c[3]) && Number(c[4]) < 24 && Number(c[5]) < 60 && Number(c[6]) < 60;
}

export const validEmail = (s: string): boolean => EMAIL.test(s);

/** Valor INTEGER lido do banco → JSON trafegado. `reference` é montado pelo chamador (precisa do título). */
export function intToWire(field: Field, n: number | null): unknown {
  if (n === null) return null;
  if (field.type === 'boolean') return n !== 0;
  if (field.type === 'decimal') return formatDecimal(n, field.scale);
  return n;
}

/** Coluna guardada como INTEGER? Enum depende das opções: número vai em INTEGER, texto em TEXT. */
export function isIntColumn(field: Pick<Field, 'type' | 'options'>): boolean {
  switch (field.type) {
    case 'integer':
    case 'decimal':
    case 'boolean':
    case 'reference':
    case 'flags':
      return true;
    case 'enum':
      return typeof field.options[0] === 'number';
    default:
      return false;
  }
}

/**
 * `options[].value` de um enum é o valor gravado no banco, sem tradução: string não vazia ou inteiro, todos do
 * mesmo tipo e sem repetir.
 */
export function parseOptions(values: unknown[]): SqlValue[] {
  const out: SqlValue[] = [];
  for (const v of values) {
    let option: SqlValue;
    if (typeof v === 'string' && v !== '') option = v;
    else if (typeof v === 'number' && asInt(v) !== undefined) option = v;
    else throw new Error(`opção ${JSON.stringify(v)}: use string não vazia ou inteiro`);
    if (out.length && typeof out[0] !== typeof option) throw new Error('opções misturam texto e número');
    if (out.includes(option)) throw new Error(`opção ${JSON.stringify(v)} repetida`);
    out.push(option);
  }
  return out;
}

export { isTextual };
