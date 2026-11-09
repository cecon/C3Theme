// Linhas de uma grade no input da ação (`type: grid`): o corpo trafegado e a conferência local, a mesma do backend
// para o erro aparecer antes de ir ao servidor. Chave do erro: `<grade>.<linha>.<coluna>`, como o 422 do backend.

import type { GridFieldDef } from '../actionTypes';
import type { WireRecord } from '../types';

export type GridRow = WireRecord;

const empty = (v: unknown) => v === undefined || v === null || v === '';

/** Valor como vai ao servidor: reference vira o id (o prefill traz `{ id, title }`). */
const wire = (v: unknown) => (v && typeof v === 'object' && 'id' in v ? (v as { id: string }).id : (v ?? null));

/** Linhas no formato trafegado e os erros locais (obrigatório por célula, mínimo e máximo de linhas). */
export function gridBody(grid: GridFieldDef, rows: GridRow[] | undefined): { rows: WireRecord[]; errors: Record<string, string> } {
  const list = rows ?? [];
  const errors: Record<string, string> = {};
  const min = grid.minItems ?? (grid.required ? 1 : 0);
  const max = grid.maxItems ?? 200;
  if (list.length < min) errors[grid.name] = `Informe pelo menos ${min} linha(s).`;
  if (list.length > max) errors[grid.name] = `No máximo ${max} linhas.`;
  const out = list.map((row, i) =>
    Object.fromEntries(
      grid.fields.map((f) => {
        if (f.required && empty(row[f.name])) errors[`${grid.name}.${i}.${f.name}`] = 'Campo obrigatório.';
        return [f.name, wire(row[f.name])];
      })
    )
  );
  return { rows: out, errors };
}

/** Linha nova: os defaults das colunas. */
export const newRow = (grid: GridFieldDef): GridRow =>
  Object.fromEntries(grid.fields.filter((f) => f.default !== undefined).map((f) => [f.name, f.default]));

/** Troca uma célula sem mexer nas outras linhas. */
export const setCell = (rows: GridRow[], i: number, name: string, v: unknown): GridRow[] =>
  rows.map((r, j) => (j === i ? { ...r, [name]: v } : r));
