// Relatório da entidade (views.report): as linhas lidas pela listagem viram grupos com subtotal e total geral, ou
// uma árvore pelo campo `parent`. Sem React; a tela fica em pages/report.

import { sumField } from './pages/list/selectionSum';
import type { EntityDef, FieldDef, ReportView, WireRecord } from './types';

export type Sums = Record<string, number | string>;

/** Uma linha impressa do relatório, na ordem em que aparece. */
export type ReportLine =
  | { kind: 'group'; level: number; label: string; count: number }
  | { kind: 'row'; row: WireRecord; depth: number }
  | { kind: 'subtotal'; level: number; label: string; count: number; sums: Sums }
  | { kind: 'total'; count: number; sums: Sums };

/** Chave estável do valor de um campo: reference agrupa pelo id. */
const keyOf = (v: unknown) =>
  v && typeof v === 'object' && 'id' in v ? String((v as { id: unknown }).id) : (v ?? '') === '' ? '' : String(v);

function sums(fields: FieldDef[], rows: WireRecord[]): Sums {
  return Object.fromEntries(fields.map((f) => [f.name, sumField(f, rows)]));
}

/**
 * Grupos de um nível: enum na ordem de `options` (valor fora delas depois), o resto pelo texto mostrado (números em
 * ordem numérica). O grupo vazio vem por último. Dentro do grupo, as linhas ficam na ordem em que vieram (a `sort` do relatório).
 */
export function groupRows(field: FieldDef, rows: WireRecord[], label: (f: FieldDef, v: unknown) => string) {
  const groups = new Map<string, { label: string; rows: WireRecord[] }>();
  for (const row of rows) {
    const key = keyOf(row[field.name]);
    if (!groups.has(key)) groups.set(key, { label: key === '' ? '(vazio)' : label(field, row[field.name]), rows: [] });
    groups.get(key)!.rows.push(row);
  }
  // valor fora de options (dado antigo) vai para o fim, antes do vazio
  const order = (key: string) => {
    const i = (field.options ?? []).findIndex((o) => String(o.value) === key);
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...groups.entries()]
    .sort(([a, ga], [b, gb]) => {
      if (a === '' || b === '') return a === '' ? (b === '' ? 0 : 1) : -1;
      if (field.type === 'enum') return order(a) - order(b);
      return ga.label.localeCompare(gb.label, undefined, { numeric: true });
    })
    .map(([, g]) => g);
}

/** Linhas do relatório agrupado: cabeçalho do grupo, linhas, subtotal; no fim, o total geral. */
export function reportLines(
  def: EntityDef,
  view: ReportView,
  rows: WireRecord[],
  label: (f: FieldDef, v: unknown) => string
): ReportLine[] {
  const fieldOf = (n: string) => def.fields.find((f) => f.name === n)!;
  const totals = (view.subtotals ?? []).map(fieldOf).filter(Boolean);
  if (view.tree) return treeOrder(rows, view.tree.parent).map(({ row, depth }) => ({ kind: 'row', row, depth }));
  const levels = (view.groupBy ?? []).map(fieldOf).filter(Boolean);
  const out: ReportLine[] = [];
  const walk = (part: WireRecord[], level: number) => {
    if (level === levels.length) {
      for (const row of part) out.push({ kind: 'row', row, depth: 0 });
      return;
    }
    for (const g of groupRows(levels[level], part, label)) {
      out.push({ kind: 'group', level, label: g.label, count: g.rows.length });
      walk(g.rows, level + 1);
      if (totals.length) out.push({ kind: 'subtotal', level, label: g.label, count: g.rows.length, sums: sums(totals, g.rows) });
    }
  };
  walk(rows, 0);
  if (totals.length) out.push({ kind: 'total', count: rows.length, sums: sums(totals, rows) });
  return out;
}

/**
 * Árvore pelo campo `parent` (reference para a própria entidade): cada linha logo abaixo da mãe, com a profundidade.
 * Raiz é quem não tem mãe ou cuja mãe ficou fora do filtro. Os irmãos ficam na ordem em que vieram. Um ciclo
 * (dado errado) não trava: cada linha aparece uma vez só.
 */
export function treeOrder(rows: WireRecord[], parent: string): { row: WireRecord; depth: number }[] {
  const ids = new Set(rows.map((r) => r.id));
  const children = new Map<string, WireRecord[]>();
  const roots: WireRecord[] = [];
  for (const row of rows) {
    const p = keyOf(row[parent]);
    if (p === '' || !ids.has(p) || p === row.id) roots.push(row);
    else children.set(p, [...(children.get(p) ?? []), row]);
  }
  const out: { row: WireRecord; depth: number }[] = [];
  const seen = new Set<string>();
  const visit = (row: WireRecord, depth: number) => {
    if (seen.has(row.id!)) return;
    seen.add(row.id!);
    out.push({ row, depth });
    for (const c of children.get(row.id!) ?? []) visit(c, depth + 1);
  };
  roots.forEach((r) => visit(r, 0));
  // sobra só o que está num ciclo sem raiz: entra no fim, no primeiro nível
  rows.forEach((r) => visit(r, 0));
  return out;
}

/**
 * O que a tela mostra: as linhas, ou nada quando o filtro passa do que a shell lê (`limit`). Total pela metade engana,
 * então acima do limite não há número nenhum.
 */
export function buildReport(
  def: EntityDef,
  view: ReportView,
  data: { rows: WireRecord[]; total: number },
  limit: number,
  label: (f: FieldDef, v: unknown) => string
): { tooMany: boolean; lines: ReportLine[] } {
  if (data.total > limit) return { tooMany: true, lines: [] };
  return { tooMany: false, lines: reportLines(def, view, data.rows, label) };
}
