// Linhas de uma grade no input da ação (`type: grid`): o corpo trafegado e a conferência local, a mesma do backend
// para o erro aparecer antes de ir ao servidor. Chave do erro: `<grade>.<linha>.<coluna>`, como o 422 do backend.

import { gridInputs, type ActionDef, type GridFieldDef } from '../actionTypes';
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

/** Chave da linha para casar a grade nova com a da tela: as colunas `readOnly` (o produto, a forma de pagamento). */
const rowKey = (grid: GridFieldDef, row: GridRow) => {
  const keys = grid.fields.filter((f) => f.readOnly);
  return keys.length ? JSON.stringify(keys.map((f) => wire(row[f.name]))) : undefined;
};

/**
 * Linhas que a prévia mandou (`fill`) trocam as da tela. Numa linha de mesma chave (colunas `readOnly`), a célula que
 * o usuário mudou (diferente do que o sistema tinha mandado antes, `before`) fica. Sem coluna `readOnly` não há como
 * casar: as linhas do sistema entram inteiras.
 */
export function mergeGridFill(grid: GridFieldDef, current: GridRow[], before: GridRow[], next: GridRow[]): GridRow[] {
  const index = (rows: GridRow[]) => new Map(rows.flatMap((r) => (rowKey(grid, r) ? [[rowKey(grid, r)!, r] as const] : [])));
  const mine = index(current);
  const sent = index(before);
  return next.map((row) => {
    const key = rowKey(grid, row);
    const typed = key && mine.get(key);
    if (!typed) return row;
    const was = sent.get(key!) ?? {};
    const kept = grid.fields.filter((f) => !f.readOnly && !Object.is(wire(typed[f.name]), wire(was[f.name])));
    return { ...row, ...Object.fromEntries(kept.map((f) => [f.name, typed[f.name]])) };
  });
}

/**
 * Grades `fromSelection` da ação abertas com uma linha por registro marcado: a coluna da seleção com `{ id, title }`,
 * as outras `readOnly` com o valor do campo de mesmo nome no registro e as editáveis com o default.
 */
export function selectionInput(action: ActionDef, records: WireRecord[], title: (r: WireRecord) => string): WireRecord {
  const out: WireRecord = {};
  for (const g of gridInputs(action)) {
    const col = g.fromSelection;
    if (!col) continue;
    out[g.name] = records.map((r) => ({
      ...newRow(g),
      ...Object.fromEntries(g.fields.filter((f) => f.readOnly && f.name in r).map((f) => [f.name, r[f.name]])),
      [col]: { id: r.id, title: title(r) }
    }));
  }
  return out;
}
