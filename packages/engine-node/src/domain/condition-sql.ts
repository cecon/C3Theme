// Condição em SQL (listagem). Cada folha vale sempre 0 ou 1, nunca NULL, para concordar com `evalCondition`.

import type { Condition } from './condition';
import type { SqlValue } from './types';

const CMP: Record<string, string> = { eq: '=', ne: '<>', lt: '<', lte: '<=', gt: '>', gte: '>=' };

function emptySql(col: string, intCol: boolean): string {
  return intCol ? `(${col} IS NULL)` : `(${col} IS NULL OR ${col} = '')`;
}

/** SQL que sempre vale 0 ou 1. `table` é o alias da tabela na consulta; os valores vão em `params`, na ordem. */
export function conditionSql(c: Condition, table: string, params: SqlValue[]): string {
  switch (c.kind) {
    case 'and':
      return `(${c.items.map((x) => conditionSql(x, table, params)).join(' AND ')})`;
    case 'or':
      return `(${c.items.map((x) => conditionSql(x, table, params)).join(' OR ')})`;
    case 'not':
      return `(NOT ${conditionSql(c.inner, table, params)})`;
    case 'leaf': {
      const col = `${table}."${c.field}"`;
      const empty = emptySql(col, c.intCol);
      switch (c.op) {
        case 'null':
          return c.arg === true ? empty : `(NOT ${empty})`;
        case 'ne':
          params.push(c.values[0]);
          return `(${empty} OR ${col} <> ?)`;
        case 'in':
          params.push(...c.values);
          return `(NOT ${empty} AND ${col} IN (${c.values.map(() => '?').join(', ')}))`;
        case 'contains':
          params.push(containsPattern(String(c.arg)));
          return `(NOT ${empty} AND ${col} REGEXP ?)`;
        default:
          params.push(c.values[0]);
          return `(NOT ${empty} AND ${col} ${CMP[c.op]} ?)`;
      }
    }
  }
}

/**
 * Padrão para `REGEXP` (registrado na conexão pelo adaptador do `Store`): Unicode, sem diferenciar maiúsculas. Segue
 * a convenção do c3-engine (`(?i)` na frente, texto escapado), para os dois motores lerem o mesmo banco.
 */
export function containsPattern(needle: string): string {
  return `(?i)${needle.replace(/[\\^$.*+?()[\]{}|/]/g, '\\$&')}`;
}

/** O SQL da condição com cada `?` trocado pelo valor literal (entra em subconsultas sem mexer nos parâmetros). */
export function literalSql(c: Condition, alias: string): string {
  const params: SqlValue[] = [];
  const sql = conditionSql(c, alias, params);
  let i = 0;
  // o SQL gerado só tem identificadores e `?`; todo texto vem dos parâmetros, então trocar em ordem é seguro
  return sql.replace(/\?/g, () => {
    const v = params[i++];
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
    return 'NULL';
  });
}
