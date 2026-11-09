// Somas das linhas marcadas (`summary` das ações em lote): a seleção é da página, então a shell soma o que já
// está na tela, sem pedir ao backend.

import { displayValue } from '../../format';
import type { ActionDef } from '../../actionTypes';
import type { EntityDef, FieldDef, Text, WireRecord } from '../../types';

/** Campos de `summary` das ações, sem repetir, na ordem em que aparecem. */
export function summaryFields(actions: ActionDef[]): string[] {
  return [...new Set(actions.flatMap((a) => (a.summary ?? []).map((s) => s.field)))];
}

/** Valor trafegado (decimal em string, como "14.75") em unidades inteiras da escala: sem erro de ponto flutuante. */
function scaled(v: unknown, scale: number): number {
  if (v === null || v === undefined || v === '') return 0;
  const [int, frac = ''] = String(v).replace('-', '').split('.');
  const units = Number(int || '0') * 10 ** scale + Number(frac.padEnd(scale, '0').slice(0, scale) || '0');
  return String(v).startsWith('-') ? -units : units;
}

/** Soma de um campo nas linhas: integer como número, decimal como string na escala do campo. Vazio conta zero. */
export function sumField(field: FieldDef, rows: WireRecord[]): number | string {
  if (field.type !== 'decimal') return rows.reduce((acc, r) => acc + (Number(r[field.name]) || 0), 0);
  const scale = field.scale ?? 2;
  const total = rows.reduce((acc, r) => acc + scaled(r[field.name], scale), 0);
  const abs = Math.abs(total);
  const int = Math.floor(abs / 10 ** scale);
  const frac = String(abs % 10 ** scale).padStart(scale, '0');
  return `${total < 0 ? '-' : ''}${int}${scale ? `.${frac}` : ''}`;
}

/** "Total: 14,75 · Taxa: 0,42" das linhas, nos campos pedidos que existem e são números. */
export function summaryText(
  def: EntityDef,
  rows: WireRecord[],
  names: string[],
  locale: string,
  text: (t: Text | undefined) => string
): string {
  return names
    .map((n) => def.fields.find((f) => f.name === n))
    .filter((f): f is FieldDef => f !== undefined && (f.type === 'integer' || f.type === 'decimal'))
    .map((f) => `${text(f.label)}: ${displayValue(f, sumField(f, rows), locale, () => '')}`)
    .join(' · ');
}
