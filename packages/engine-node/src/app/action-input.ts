// Input da ação: o objeto vira os campos de `action.input` (400 no desconhecido) e passa pelas regras dos campos
// (422), como no CRUD. Grades (`type: "grid"`) são validadas linha a linha. A prévia aceita o que ainda falta.

import type { Action } from '../domain/action-spec';
import { type Entity, fieldOf } from '../domain/entity';
import { ApiError, FieldErrors } from '../domain/errors';
import type { GridInput } from '../domain/grid-spec';
import { type Rec, isObject, isTextual } from '../domain/types';
import type { Conn } from '../ports/store';
import type { Ctx, Owner } from './ctx';
import { writable } from './read';
import { checkFields, isVisible } from './validation';

/** Input = objeto com os campos de `input`. Campo desconhecido → 400; ausente recebe o default. */
export function parseInput(input: Entity, obj: Rec): Rec {
  const out = { ...obj };
  const unknown = Object.keys(out).find((k) => !fieldOf(input, k));
  if (unknown !== undefined) throw ApiError.badRequest(`Campo desconhecido '${unknown}'.`);
  for (const f of input.fields) {
    if (!(f.name in out)) out[f.name] = f.default ?? null;
    // reference no input vai como id; aceita também { id, title }
    const v = out[f.name];
    if (f.type === 'reference' && isObject(v)) out[f.name] = v.id ?? null;
  }
  return out;
}

/** Tira do corpo as grades. */
function takeGrids(grids: GridInput[], obj: Rec): Rec {
  const out: Rec = {};
  for (const g of grids) {
    if (!(g.name in obj)) continue;
    out[g.name] = obj[g.name];
    delete obj[g.name];
  }
  return out;
}

/** O input cru: os campos comuns por `parseInput` e as grades como vieram. */
export function parseActionInput(action: Action, obj: Rec): Rec {
  const rest = { ...obj };
  const grids = takeGrids(action.grids, rest);
  return { ...parseInput(action.input, rest), ...grids };
}

/** Valida cada grade e devolve as linhas como o sistema recebe (todo campo presente; texto vazio = null). */
async function checkGrids(conn: Conn, ctx: Ctx, grids: GridInput[], owner: Owner, raw: Rec, errors: FieldErrors): Promise<Rec> {
  const out: Rec = {};
  for (const g of grids) {
    const v = raw[g.name];
    if (v !== undefined && v !== null && !Array.isArray(v)) throw ApiError.badRequest(`'${g.name}' precisa ser uma lista de linhas.`);
    const items = Array.isArray(v) ? v : [];
    if (items.length > g.maxItems) errors.add(g.name, 'max_items', `No máximo ${g.maxItems} linhas.`);
    else if (items.length < g.minItems) errors.add(g.name, 'min_items', `Informe pelo menos ${g.minItems} linha(s).`);
    const lines: Rec[] = [];
    for (const [i, item] of items.entries()) {
      if (!isObject(item)) throw ApiError.badRequest(`Linha ${i} de '${g.name}' precisa ser um objeto.`);
      const line = parseInput(g.row, item);
      const lineErrors = new FieldErrors();
      await checkFields(conn, ctx, g.row, owner, line, false, lineErrors);
      errors.absorb(`${g.name}.${i}.`, lineErrors);
      lines.push(
        Object.fromEntries(
          g.row.fields.map((f) => {
            const x = line[f.name] ?? null;
            return [f.name, isTextual(f.type) && x === '' ? null : x];
          })
        )
      );
    }
    out[g.name] = lines;
  }
  return out;
}

/** Valida o input (422) e devolve o que o sistema recebe: todo campo, escondido ou vazio como `null`. */
export async function checkInput(conn: Conn, ctx: Ctx, action: Action, owner: Owner, raw: Rec, partial = false): Promise<Rec> {
  const input = { ...raw };
  const rows = takeGrids(action.grids, input);
  const errors = new FieldErrors();
  await checkFields(conn, ctx, action.input, owner, input, false, errors);
  const lines = await checkGrids(conn, ctx, action.grids, owner, rows, errors);
  // na prévia, o input pela metade vale: só falta de campo não barra
  if (partial) errors.retain((code) => code !== 'required' && code !== 'min_items');
  if (!errors.isEmpty()) throw ApiError.validation(errors);
  const out: Rec = {};
  for (const f of writable(action.input)) {
    const v = input[f.name] ?? null;
    const keep = isVisible(action.input, f, input) && !(isTextual(f.type) && v === '');
    out[f.name] = keep ? v : null;
  }
  return { ...out, ...lines };
}

/** Grade `fromSelection`: as linhas são exatamente os registros marcados, um por linha. Fora disso, 422 na grade. */
export function checkSelection(grids: GridInput[], input: Rec, ids: string[]): void {
  const errors = new FieldErrors();
  for (const g of grids) {
    const col = g.fromSelection;
    if (col === undefined) continue;
    const lines = Array.isArray(input[g.name]) ? (input[g.name] as Rec[]) : [];
    const got = lines.map((l) => String(l[col])).sort();
    const want = [...ids].sort();
    if (got.join('\u0000') !== want.join('\u0000'))
      errors.add(g.name, 'selection', 'As linhas precisam ser os registros marcados, um por linha.');
  }
  if (!errors.isEmpty()) throw ApiError.validation(errors);
}
