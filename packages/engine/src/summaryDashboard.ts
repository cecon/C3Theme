import type { Text } from './types';

/** Caminho relativo à API; a resposta é um documento JSON, sem envelope data. */
export interface SummarySource {
  path: string;
  /** Revalidação periódica em ms, opcional; 0 desliga. */
  refreshInterval?: number;
}
export interface SummaryField {
  label: Text;
  field: string;
  format?: 'number' | 'date' | 'datetime' | 'currency' | 'text';
  /** Campo do documento com código ISO 4217 (ex.: BRL). */
  currencyField?: string;
}
interface SummaryBase {
  title: Text;
  source?: SummarySource;
  width?: number;
}
export interface SummaryKpi extends SummaryBase {
  type: 'summary-kpi';
  /** Opcional: um indicador por objeto da coleção do resumo. */
  items?: string;
  label?: string;
  value: string;
  progress?: { label: Text; limit: string };
  fields?: SummaryField[];
}
export interface SummaryRanking extends SummaryBase {
  type: 'summary-ranking';
  items: string;
  label: string;
  value: string;
  /** Campo percentual de cada item (0–100); ausente: calculado pela soma. */
  share?: string;
  limit?: number;
}
export interface SummaryObject extends SummaryBase {
  type: 'summary-object';
  fields: SummaryField[];
  state: string;
  states: Record<string, { label: Text; warning?: Text }>;
  message?: string;
  warnings?: { field: string; equals: string | boolean; message: Text }[];
  progress?: { label: Text; value: string; limit: string };
  actions?: { label: Text; path: string; disabled?: string; instruction?: string }[];
}
export type SummaryWidget = SummaryKpi | SummaryRanking | SummaryObject;
export const isSummary = (widget: { type: string }): widget is SummaryWidget => widget.type.startsWith('summary-');

/** Só lê propriedades próprias; nenhum caminho atravessa protótipos. */
export function summaryValue(data: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (value, key) =>
        value !== null && typeof value === 'object' && Object.hasOwn(value, key) ? (value as Record<string, unknown>)[key] : undefined,
      data
    );
}
export function summaryNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' && (typeof value !== 'string' || value.trim() === '')) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}
export function summaryPercent(value: unknown, limit: unknown): number {
  const n = summaryNumber(value),
    total = summaryNumber(limit);
  return n !== undefined && total !== undefined && total > 0 ? Math.max(0, Math.min(100, (n / total) * 100)) : 0;
}
export function summaryFormat(data: unknown, field: SummaryField, locale: string): string {
  const value = summaryValue(data, field.field);
  if (value === undefined || value === null) return '—';
  if (field.format === 'date' || field.format === 'datetime') {
    const date = new Date(String(value));
    if (!Number.isFinite(date.getTime())) return '—';
    return field.format === 'date' ? date.toLocaleDateString(locale) : date.toLocaleString(locale);
  }
  if (field.format === 'currency') {
    const currency = field.currencyField && summaryValue(data, field.currencyField);
    const n = summaryNumber(value);
    if (n === undefined || typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return '—';
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n);
    } catch {
      return '—';
    }
  }
  if (field.format === 'number') return summaryNumber(value)?.toLocaleString(locale) ?? '—';
  return typeof value === 'object' ? '—' : String(value);
}
