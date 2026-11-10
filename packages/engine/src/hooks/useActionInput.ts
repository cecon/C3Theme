import { useRef, useState } from 'react';

import { evaluate } from '../conditions.mjs';
import { gridInputs, plainInputs } from '../actionTypes';
import { gridBody, mergeGridFill, newRow, setCell, type GridRow } from './gridRows';
import { suggestions } from './suggest';
import type { ActionDef, FieldDef, FieldType, WireRecord } from '../types';

/** Reference cujo `filter` lê `name` (`{"$field": name}`): a escolha dele deixa de valer quando `name` muda. */
const cleared = (list: FieldDef[], name: string) => {
  const needle = JSON.stringify({ $field: name });
  return Object.fromEntries(list.filter((f) => f.filter && JSON.stringify(f.filter).includes(needle)).map((f) => [f.name, null]));
};

/**
 * Estado do input de uma ação no diálogo (de registro, em lote ou da lista): valores, grades, condições dos campos,
 * erros locais e o corpo que vai ao servidor.
 */
export default function useActionInput(action: ActionDef | null) {
  const [input, setInput] = useState<WireRecord>({});
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);
  // o último valor que a prévia sugeriu em cada campo: enquanto o usuário não trocar, a próxima prévia atualiza
  const suggested = useRef<Record<string, unknown>>({});
  // as últimas linhas que o sistema mandou em cada grade (prefill ou prévia), para saber o que o usuário mudou
  const sentRows = useRef<Record<string, GridRow[]>>({});
  const fields = plainInputs(action);
  const grids = gridInputs(action);
  const types = Object.fromEntries(fields.map((f) => [f.name, f.type])) as Record<string, FieldType>;
  const visible = (f: FieldDef) => !f.visibleWhen || evaluate(f.visibleWhen, input, types);
  const required = (f: FieldDef) => Boolean(f.required) || Boolean(f.requiredWhen && evaluate(f.requiredWhen, input, types));
  const dirty =
    touched ||
    fields.some((f) => {
      const v = input[f.name];
      return v !== undefined && v !== null && v !== '' && v !== f.default;
    });

  /** Abre o diálogo de `next`: input com os defaults e, por cima, os valores iniciais do sistema (`prefill`). */
  const reset = (next: ActionDef, initial: WireRecord = {}) => {
    suggested.current = {};
    sentRows.current = Object.fromEntries(gridInputs(next).map((g) => [g.name, (initial[g.name] as GridRow[] | undefined) ?? []]));
    setLocalErrors({});
    setTouched(false);
    const defaults = plainInputs(next).filter((f) => f.default !== undefined);
    setInput({ ...Object.fromEntries(defaults.map((f) => [f.name, f.default])), ...initial });
  };

  const drop = (prefix: string) =>
    setLocalErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => k !== prefix && !k.startsWith(`${prefix}.`))));

  const change = (name: string, v: unknown) => {
    setInput((r) => ({ ...r, [name]: v, ...cleared(fields, name) }));
    drop(name);
  };

  const rowsOf = (grid: string) => (input[grid] as GridRow[] | undefined) ?? [];

  const changeCell = (grid: string, i: number, name: string, v: unknown) => {
    setTouched(true);
    const cols = grids.find((g) => g.name === grid)?.fields ?? [];
    setInput((r) => ({ ...r, [grid]: setCell((r[grid] as GridRow[] | undefined) ?? [], i, name, v, cleared(cols, name)) }));
    drop(`${grid}.${i}.${name}`);
  };

  const removeRow = (grid: string, i: number) => {
    setTouched(true);
    setInput((r) => ({ ...r, [grid]: ((r[grid] as GridRow[] | undefined) ?? []).filter((_, j) => j !== i) }));
    drop(grid);
  };

  /** Linha nova no fim (grade sem coluna readOnly: parcelas, orçamento). */
  const addRow = (grid: string) => {
    const g = grids.find((x) => x.name === grid);
    if (!g) return;
    setTouched(true);
    setInput((r) => ({ ...r, [grid]: [...((r[grid] as GridRow[] | undefined) ?? []), newRow(g)] }));
    drop(grid);
  };

  /** Erro do servidor ou local cita algo deste diálogo? (`prices.2.price` é da grade `prices`) */
  const knows = (key: string) => [...fields, ...grids].some((f) => key === f.name || key.startsWith(`${f.name}.`));

  /** O input no formato trafegado e o que falta preencher, sem marcar nada na tela. */
  const collect = () => {
    const local: Record<string, string> = {};
    const out: WireRecord = {};
    for (const f of fields) {
      const v = visible(f) ? (input[f.name] ?? null) : null;
      if (visible(f) && required(f) && (v === null || v === '')) local[f.name] = 'Campo obrigatório.';
      out[f.name] = f.type === 'reference' && v && typeof v === 'object' ? (v as { id: string }).id : v;
    }
    for (const g of grids) {
      const { rows, errors } = gridBody(g, rowsOf(g.name));
      Object.assign(local, errors);
      out[g.name] = rows;
    }
    return { out, local };
  };

  /** Mesma regra do backend, para o erro aparecer antes de ir ao servidor. `undefined` = falta campo. */
  const body = (): WireRecord | undefined => {
    const { out, local } = collect();
    setLocalErrors(local);
    return Object.keys(local).length ? undefined : out;
  };

  /** O input como está, para a prévia: o que falta vai vazio e não vira erro na tela. */
  const snapshot = () => collect().out;

  /**
   * Sugestões da prévia: entram no campo vazio ou que ainda tem a sugestão anterior. O que o usuário digitou fica.
   * Linhas de uma grade trocam as da tela (`mergeGridFill`).
   */
  const fill = (values: Record<string, unknown>) =>
    setInput((r) => {
      const next = suggestions(
        r,
        values,
        fields.map((f) => f.name),
        suggested.current
      );
      suggested.current = { ...suggested.current, ...next };
      // grade na prévia: as linhas do sistema trocam as da tela, mantendo o que o usuário digitou na mesma linha
      for (const g of grids) {
        const rows = values[g.name];
        if (!Array.isArray(rows)) continue;
        next[g.name] = mergeGridFill(g, (r[g.name] as GridRow[] | undefined) ?? [], sentRows.current[g.name] ?? [], rows as GridRow[]);
        sentRows.current[g.name] = rows as GridRow[];
      }
      return Object.keys(next).length ? { ...r, ...next } : r;
    });

  return {
    fields,
    grids,
    input,
    localErrors,
    visible,
    required,
    dirty,
    reset,
    change,
    rowsOf,
    changeCell,
    addRow,
    removeRow,
    knows,
    body,
    snapshot,
    fill
  };
}
