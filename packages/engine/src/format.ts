// Exibição dos valores trafegados (spec/README.md#tipos-de-campo-e-formato-trafegado) para o usuário.

import { formatDecimal, formatMoney } from '@c3theme/ui';

import { maskDocument } from './documents.mjs';
import type { EntityDef, FieldDef, RefValue } from './types';

export function formatDate(v: string, locale: string) {
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale);
}

export function formatDatetime(v: string, locale: string) {
  return new Date(v).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' });
}

/** Decimal com a escala do campo; com `currency`, como dinheiro (R$ 9.568,20). */
export function formatAmount(v: string, field: FieldDef, locale: string) {
  const scale = field.scale ?? 2;
  return field.currency ? formatMoney(v, scale, field.currency, locale) : formatDecimal(v, scale, locale);
}

/** Número com a unidade do campo: "%" colado ("10%"), as outras com espaço ("2,5 kg"). */
export const withUnit = (shown: string, unit?: string) => (!unit ? shown : unit === '%' ? `${shown}%` : `${shown} ${unit}`);

/** Resultado de uma fórmula, com duas casas; com `currency`, como dinheiro. */
export function formatComputed(n: number, locale: string, currency?: string) {
  const v = (Math.round(n * 100) / 100).toFixed(2);
  return currency ? formatMoney(v, 2, currency, locale) : formatDecimal(v, 2, locale);
}

/**
 * Valor sem espaço (código "FAT-2026-1026", data, e-mail) fica numa linha só: o navegador quebraria no hífen ou
 * na barra, e no celular o código vira três linhas. Texto com espaço continua quebrando entre palavras.
 */
export const keepsTogether = (shown: string) => shown !== '' && !/[ \t\n]/.test(shown);

/** Número fica à direita em toda tabela, para as casas se alinharem. */
export const isNumeric = (field: FieldDef) => field.type === 'integer' || field.type === 'decimal';

/** Opção de um enum pelo valor trafegado ou pelo texto dele (filtro na URL, valor de <select>). */
export function findOption(field: FieldDef | undefined, v: unknown) {
  return field?.options?.find((o) => String(o.value) === String(v));
}

/** Texto curto de um valor (lista, detalhe). */
export function displayValue(field: FieldDef, v: unknown, locale: string, optionLabel: (value: string) => string): string {
  if (v === null || v === undefined || v === '') return '';
  switch (field.type) {
    case 'decimal':
      return withUnit(formatAmount(String(v), field, locale), field.unit);
    case 'integer':
      return withUnit(Number(v).toLocaleString(locale), field.unit);
    case 'date':
      return formatDate(String(v), locale);
    case 'datetime':
      return formatDatetime(String(v), locale);
    case 'boolean':
      return v ? 'Sim' : 'Não';
    case 'enum':
      return optionLabel(String(v));
    case 'flags': {
      // nenhum, todos ou os marcados na ordem das opções ("Seg, Qua, Sex")
      const bits = (field.options ?? []).map((o) => Number(o.value));
      if (v === 0) return 'Nenhum';
      if (bits.every((b) => (Number(v) & b) !== 0)) return 'Todos';
      return bits
        .filter((b) => (Number(v) & b) !== 0)
        .map((b) => optionLabel(String(b)))
        .join(', ');
    }
    case 'reference':
      // title null: registro apontado fora do que o usuário pode ler
      return (v as RefValue).title ?? 'Sem acesso';
    case 'file':
      return (v as { name?: string }).name ?? '';
    default:
      return field.format ? maskDocument(String(v), field.format) : String(v);
  }
}

/** UTC da spec (`2026-10-17T02:55:17Z`) ↔ valor de <input type="datetime-local"> no fuso do navegador. */
export function datetimeToLocalInput(v: string) {
  const d = new Date(v);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function localInputToDatetime(v: string) {
  return new Date(v).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Colunas da lista sem `views.list.columns`: os 5 primeiros campos, menos os só de escrita (senha). */
export function defaultColumns(def: EntityDef): string[] {
  return def.fields
    .filter((f) => !f.writeOnly)
    .slice(0, 5)
    .map((f) => f.name);
}
