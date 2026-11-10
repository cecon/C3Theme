// Grade no input de uma ação (`type: "grid"`): várias linhas digitadas de uma vez (contar cada forma de pagamento,
// ajustar o preço de 50 produtos). Aqui só a declaração; a validação das linhas fica em app/action-grid.ts.

import { type Entity, fieldsOnly } from './entity';
import { notForInput, parseFields } from './field';
import { isObject } from './types';

/** Teto de linhas de uma grade (o corpo da requisição tem 2 MB). */
export const MAX_GRID_ROWS = 500;
const DEFAULT_MAX = 200;

export interface GridInput {
  name: string;
  /** Os campos de cada linha, como uma entidade sem tabela. */
  row: Entity;
  minItems: number;
  maxItems: number;
  /**
   * `fromSelection`: a coluna `reference` da própria entidade que a shell preenche com as linhas marcadas (uma por
   * registro); só em ação `bulk: "together"`, e o motor confere que as linhas são exatamente a seleção.
   */
  fromSelection?: string;
}

/** Separa as grades (`grid`) do input cru da spec; os outros seguem para `parseFields`. */
export function splitGrids(label: string, raw: unknown[], ident: (n: string) => boolean): [unknown[], GridInput[]] {
  const fields: unknown[] = [];
  const grids: GridInput[] = [];
  for (const f of raw) {
    if (!isObject(f) || f.type !== 'grid') {
      fields.push(f);
      continue;
    }
    const name = typeof f.name === 'string' ? f.name : '';
    const at = `${label}.${name}`;
    if (!ident(name)) throw new Error(`${label}: nome de campo inválido '${name}'`);
    const count = (k: string) => (typeof f[k] === 'number' && (f[k] as number) >= 0 ? (f[k] as number) : undefined);
    const minItems = count('minItems') ?? (f.required === true ? 1 : 0);
    const maxItems = count('maxItems') ?? DEFAULT_MAX;
    if (maxItems === 0 || maxItems > MAX_GRID_ROWS || minItems > maxItems)
      throw new Error(`${at}: maxItems de 1 a ${MAX_GRID_ROWS}, e minItems até ele`);
    if (!Array.isArray(f.fields) || f.fields.length === 0) throw new Error(`${at}: grid precisa de fields`);
    // readOnly na linha só trava a tela; para o motor o valor vem e é validado
    const sub = f.fields.map((c) => {
      if (!isObject(c)) return c;
      if (c.type === 'grid') throw new Error(`${at}: grade dentro de grade não vale`);
      const { readOnly: _ignored, ...rest } = c;
      return rest;
    });
    const [cols, conditions] = parseFields(at, sub, ident);
    if (conditions.some((c) => c[1] !== undefined || c[2] !== undefined || c[3] !== undefined))
      throw new Error(`${at}: campo da linha não tem visibleWhen, requiredWhen nem readOnlyWhen`);
    const bad = cols.find((c) => notForInput(c) || c.type === 'file');
    if (bad) throw new Error(`${at}.${bad.name}: campo da linha não pode ser file, createOnly nem ter access`);
    const fromSelection = typeof f.fromSelection === 'string' ? f.fromSelection : undefined;
    if (fromSelection !== undefined && !cols.some((c) => c.name === fromSelection && c.type === 'reference'))
      throw new Error(`${at}.fromSelection: '${fromSelection}' precisa ser uma coluna reference da grade`);
    grids.push({ name, row: fieldsOnly(at, cols), minItems, maxItems, fromSelection });
  }
  return [fields, grids];
}
