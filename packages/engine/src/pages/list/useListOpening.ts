// Linha de saldo de abertura da lista (#36, `views.list.opening`): com o filtro de período ativo e os `groupBy`
// fixados (um produto num almoxarifado), o saldo antes da data inicial. Usa a mesma consulta da lista trocando o
// período por "antes do início": `sum` pelo `_aggregate`, `last` pela última linha (data e id decrescentes).

import useSWR from 'swr';

import { useEngine } from '../../context';
import type { Condition, ListOpening } from '../../types';
import type { ListQuery } from './useListQuery';
import { readTotals } from './useListTotals';

type Leaf = { field: string; op: string; value?: unknown };

const leaves = (where: Condition | undefined): Condition[] =>
  !where ? [] : 'and' in where && Array.isArray(where.and) ? where.and.flatMap(leaves) : [where];

const isLeaf = (c: Condition): c is Condition & Leaf => 'field' in c && 'op' in c;

/**
 * O filtro do saldo anterior: o mesmo `where` sem os limites do período e com "antes do início". `undefined` quando
 * a linha não vale: sem data inicial, ou um `groupBy` sem `eq` no filtro (a soma misturaria grupos).
 */
export function openingWhere(where: Condition | undefined, opening: ListOpening): { where: Condition; from: string } | undefined {
  const parts = leaves(where);
  const start = parts.find((c) => isLeaf(c) && c.field === opening.dateField && (c.op === 'gte' || c.op === 'gt')) as Leaf | undefined;
  if (!start || typeof start.value !== 'string') return undefined;
  const fixed = (g: string) => parts.some((c) => isLeaf(c) && c.field === g && c.op === 'eq' && c.value !== null && c.value !== undefined);
  if (!(opening.groupBy ?? []).every(fixed)) return undefined;
  const rest = parts.filter((c) => !(isLeaf(c) && c.field === opening.dateField && ['gte', 'gt', 'lte', 'lt'].includes(c.op)));
  const before: Condition = { field: opening.dateField, op: start.op === 'gt' ? 'lte' : 'lt', value: start.value };
  return { where: { and: [...rest, before] }, from: start.value };
}

/** O saldo anterior (no formato trafegado; 0 sem linhas antes) e a data inicial; `undefined` quando não vale. */
export function useListOpening(entity: string, opening: ListOpening | undefined, query: ListQuery) {
  const { client, org } = useEngine();
  const { q, where, branchesParam, shownBranches, sourceParams } = query;
  const target = opening && openingWhere(where, opening);
  const base = { q: q || undefined, branches: branchesParam ? shownBranches : undefined, params: sourceParams };
  const key = target
    ? ['c3-list', entity, 'opening', opening!.field, opening!.measure, q, JSON.stringify(target.where), branchesParam, org?.active]
    : null;
  const { data } = useSWR(
    key,
    async () => {
      const { field, dateField, measure } = opening!;
      if (measure === 'last') {
        const res = await client.list(entity, { ...base, where: target!.where, sort: `-${dateField},-id`, pageSize: 10 });
        return res.data[0]?.[field] ?? 0;
      }
      return readTotals([field], await client.aggregate(entity, { ...base, where: target!.where, measure: [`sum:${field}`] }))[field] ?? 0;
    },
    { keepPreviousData: false }
  );
  return target && data !== undefined ? { value: data as number | string, from: target.from } : undefined;
}
