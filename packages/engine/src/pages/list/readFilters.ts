import { findOption } from '../../format';
import type { Condition, FieldDef } from '../../types';

/** Filtros da barra (`f.<campo>=valor` na URL) viram condições `eq`. */
export function readFilters(params: URLSearchParams, fields: FieldDef[]): Condition[] {
  const out: Condition[] = [];
  for (const [k, v] of params) {
    if (!k.startsWith('f.')) continue;
    const f = fields.find((x) => x.name === k.slice(2));
    if (!f || v === '') continue;
    const value = f.type === 'boolean' ? v === 'true' : f.type === 'enum' ? (findOption(f, v)?.value ?? v) : v;
    out.push({ field: f.name, op: 'eq', value });
  }
  return out;
}

/** Período da barra (`views.list.dateRange`): `f.<campo>.de` e `f.<campo>.ate` na URL viram `gte` e `lte`. */
export function readDateRange(params: URLSearchParams, field: string | undefined): Condition[] {
  if (!field) return [];
  const from = params.get(`f.${field}.de`);
  const to = params.get(`f.${field}.ate`);
  return [...(from ? [{ field, op: 'gte' as const, value: from }] : []), ...(to ? [{ field, op: 'lte' as const, value: to }] : [])];
}

/**
 * Recorte que veio de um widget do painel (`w=<condição em JSON>`, ver `widgetLink`). JSON inválido é ignorado; campo
 * desconhecido o backend recusa, como qualquer `where`.
 */
export function readWidgetWhere(params: URLSearchParams): Condition | null {
  const raw = params.get('w');
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Condition) : null;
  } catch {
    return null;
  }
}
