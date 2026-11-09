// Planta da entidade (views.map): blocos por coordenada ou dentro de grupos aninhados. Sem React; a tela fica em
// pages/map.

import { groupRows } from './report';
import type { EntityDef, FieldDef, Tone, WireRecord } from './types';
import type { MapView } from './viewTypes';

/** Lado do bloco (e da célula da grade), em px. */
export const BLOCK_SIZE = { small: 96, medium: 132, large: 176 } as const;

/** Uma caixa da planta: o valor do grupo, os blocos direto nela e as caixas de dentro (segundo nível). */
export interface MapGroup {
  label: string;
  rows: WireRecord[];
  children: MapGroup[];
}

/** Grupos aninhados pelos campos de `groupBy` (ordem de options no enum, texto no resto, vazio por último). */
export function mapGroups(def: EntityDef, view: MapView, rows: WireRecord[], label: (f: FieldDef, v: unknown) => string): MapGroup[] {
  const levels = (view.groupBy ?? []).flatMap((n) => def.fields.filter((f) => f.name === n));
  const build = (part: WireRecord[], level: number): MapGroup[] =>
    groupRows(levels[level], part, label).map((g) =>
      level + 1 < levels.length
        ? { label: g.label, rows: [], children: build(g.rows, level + 1) }
        : { label: g.label, rows: g.rows, children: [] }
    );
  return levels.length ? build(rows, 0) : [{ label: '', rows, children: [] }];
}

/** Um bloco na grade: coluna e linha (a partir de 1) e quantas células ocupa. */
export interface Placed {
  row: WireRecord;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Teto da grade: coluna/linha até 200 e bloco de até 20×20 células. Valor acima vem de cadastro errado e não pode
 * travar a planta de todo mundo (uma linha com w=100000 montaria bilhões de células). */
export const MAP_LIMIT = { cells: 200, span: 20 } as const;

const cell = (v: unknown, max: number, fallback?: number) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isInteger(n) && n >= 1 && n <= max ? n : fallback;
};

/** Largura/altura: vazia ou quebrada vale 1; acima de `MAP_LIMIT.span` é inválida (o bloco fica sem lugar). */
const span = (v: unknown) => (Number(v) > MAP_LIMIT.span ? undefined : cell(v, MAP_LIMIT.span, 1));

/**
 * Blocos posicionados por `position`. Quem não tem coordenada válida (vazia, zero, negativa, quebrada, acima de
 * `MAP_LIMIT` ou com tamanho que passa da borda) fica em `loose`; quem cai em célula já ocupada por outro bloco
 * (mesmo lugar, ou largura que invade o vizinho) fica em `clash`. A tela mostra os dois numa faixa à parte, em vez de empilhar no canto ou esconder um bloco atrás do
 * outro. Ganha a célula quem vem primeiro na ordem da leitura. `columns` e `lines` são o tamanho da grade.
 */
export function mapPlaces(
  view: MapView,
  rows: WireRecord[]
): { placed: Placed[]; loose: WireRecord[]; clash: WireRecord[]; columns: number; lines: number } {
  const pos = view.position;
  const placed: Placed[] = [];
  const loose: WireRecord[] = [];
  const clash: WireRecord[] = [];
  const taken = new Set<string>();
  for (const row of rows) {
    const x = pos ? cell(row[pos.x], MAP_LIMIT.cells) : undefined;
    const y = pos ? cell(row[pos.y], MAP_LIMIT.cells) : undefined;
    const w = pos?.w ? span(row[pos.w]) : 1;
    const h = pos?.h ? span(row[pos.h]) : 1;
    const fits = x !== undefined && y !== undefined && w !== undefined && h !== undefined;
    if (!fits || x + w - 1 > MAP_LIMIT.cells || y + h - 1 > MAP_LIMIT.cells) {
      loose.push(row);
      continue;
    }
    const cells = Array.from({ length: w * h }, (_, i) => `${x + (i % w)},${y + Math.floor(i / w)}`);
    if (cells.some((c) => taken.has(c))) {
      clash.push(row);
      continue;
    }
    cells.forEach((c) => taken.add(c));
    placed.push({ row, x, y, w, h });
  }
  const columns = Math.max(1, ...placed.map((p) => p.x + p.w - 1));
  const lines = Math.max(1, ...placed.map((p) => p.y + p.h - 1));
  return { placed, loose, clash, columns, lines };
}

/** Cor do bloco: a `color` da option do enum `color`; sem cor declarada, neutro. */
export function blockTone(def: EntityDef, view: MapView, row: WireRecord): Tone {
  const field = def.fields.find((f) => f.name === view.color);
  const option = field?.options?.find((o) => String(o.value) === String(row[field.name] ?? ''));
  return option?.color ?? 'neutral';
}

/** Legenda: as options do enum `color` que têm cor, com quantos blocos de cada há na tela. */
export function mapLegend(def: EntityDef, view: MapView, rows: WireRecord[]) {
  const field = def.fields.find((f) => f.name === view.color);
  return (field?.options ?? [])
    .filter((o) => o.color)
    .map((o) => ({ ...o, count: rows.filter((r) => String(r[field!.name] ?? '') === String(o.value)).length }));
}
