import type { Column, Row } from '@tanstack/react-table';

/** O que as colunas carregam em `meta` para o DataTable. */
export interface ColMeta {
  /** Nome legível da coluna (menus de colunas, CSV, rótulos de filtro). */
  label?: string;
  /** Tipo do filtro da coluna. Padrão: texto. */
  filterVariant?: 'text' | 'range' | 'select';
  align?: 'left' | 'center' | 'right';
  /** Valor exportado no CSV, quando diferente do valor da coluna. */
  csv?: (value: unknown) => string | number | boolean | null | undefined;
}

/** Lê o `meta` de uma coluna com o tipo do DataTable (sem augmentation global do TanStack). */
export function colMeta<T>(column: Column<T, unknown>): ColMeta {
  return (column.columnDef.meta ?? {}) as ColMeta;
}

/** Nome legível de uma coluna. */
export function colLabel<T>(column: Column<T, unknown>): string {
  const meta = colMeta(column);
  if (meta.label) return meta.label;
  return typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
}

/** Texto sem acento e em minúsculas, para comparar buscas. */
export const normalizeText = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Filtro de texto sem acento e sem caixa: serve para filtro global e de coluna. */
export function textFilter<T>(row: Row<T>, columnId: string, value: unknown): boolean {
  const search = normalizeText(String(value ?? '')).trim();
  if (!search) return true;
  const cell = row.getValue<unknown>(columnId);
  return cell !== null && cell !== undefined && normalizeText(String(cell)).includes(search);
}

/** Igualdade exata para filtros de select. */
export function equalsFilter<T>(row: Row<T>, columnId: string, value: unknown): boolean {
  return value === undefined || value === '' || row.getValue<unknown>(columnId) === value;
}
