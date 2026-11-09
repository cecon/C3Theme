import useSWR from 'swr';

import { useEngine } from '../../context';
import type { AggregateItem, Measure } from '../../dashboard';
import type { EntityDef } from '../../types';
import type { ListQuery } from './useListQuery';

/** Valor de cada total por campo, no formato trafegado (decimal em string escalada). */
export type ListTotals = Record<string, number | string>;

/**
 * Totais que a tela pode mostrar: os de `views.list.totals` cujo campo está entre as colunas (o campo que o
 * usuário não vê já saiu das colunas, e o backend recusaria somar).
 */
export function totalFields(def: EntityDef, columns: string[]): string[] {
  return (def.views?.list?.totals ?? []).map((t) => t.field).filter((f) => columns.includes(f));
}

/** Uma resposta de `_aggregate` sem groupBy virando campo → valor, na ordem das medidas pedidas. */
export function readTotals(fields: string[], data: AggregateItem[]): ListTotals {
  const item = data[0];
  if (!item) return {};
  const values = item.values ?? [item.value];
  return Object.fromEntries(fields.map((f, i) => [f, values[i]]));
}

/**
 * Totais do rodapé sobre tudo o que o filtro alcança, numa chamada só. A chave começa com 'c3-list' (gravar ou
 * rodar uma ação relê) e não leva a página: trocar de página não refaz a soma.
 */
export function useListTotals(entity: string, fields: string[], query: ListQuery) {
  const { client, org } = useEngine();
  const { q, where, branchesParam, shownBranches, sourceParams } = query;
  const key = fields.length
    ? ['c3-list', entity, 'totals', fields.join(','), q, JSON.stringify(where), branchesParam, JSON.stringify(sourceParams), org?.active]
    : null;
  const { data } = useSWR(
    key,
    () =>
      client.aggregate(entity, {
        measure: fields.map((f): Measure => `sum:${f}`),
        q: q || undefined,
        where,
        branches: branchesParam ? shownBranches : undefined,
        params: sourceParams
      }),
    { keepPreviousData: true, refreshInterval: refreshMs(query.refreshSeconds) }
  );
  return data ? readTotals(fields, data) : undefined;
}

/** Intervalo do SWR para `views.list.refreshSeconds`: 0 desliga; abaixo de 3 s vira 3 s (o schema já recusa). */
export const refreshMs = (seconds?: number) => (seconds ? Math.max(seconds, 3) * 1000 : 0);
