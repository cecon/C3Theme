import useSWR from 'swr';

import { useEngine } from '../../context';
import type { AggregateItem, Measure } from '../../dashboard';
import type { EntityDef } from '../../types';
import type { ListQuery } from './useListQuery';

/** Valor de cada total por campo, no formato trafegado (decimal em string escalada); razão sem denominador: null. */
export type ListTotals = Record<string, number | string | null>;

type TotalDef = NonNullable<NonNullable<NonNullable<EntityDef['views']>['list']>['totals']>[number];

const shownTotals = (def: EntityDef, columns: string[]): TotalDef[] =>
  (def.views?.list?.totals ?? []).filter((t) => columns.includes(t.field));

/** Campos que o `_aggregate` soma: os totais de soma e os dois lados de cada razão, sem repetir. */
export function measuredFields(def: EntityDef, columns: string[]): string[] {
  const names = shownTotals(def, columns).flatMap((t) => (t.measure === 'ratio' ? [t.numerator!, t.denominator!] : [t.field]));
  return [...new Set(names)];
}

/**
 * Os totais da tela a partir das somas: soma passa direto; razão é Σ numerator ÷ Σ denominator × factor, nas casas
 * do campo (decimal) ou inteira, e null quando o denominador soma zero (a média dos percentuais não quer dizer nada).
 */
export function withRatios(def: EntityDef, columns: string[], sums: ListTotals): ListTotals {
  const out: ListTotals = {};
  for (const t of shownTotals(def, columns)) {
    if (t.measure !== 'ratio') {
      if (t.field in sums) out[t.field] = sums[t.field];
      continue;
    }
    const n = Number(sums[t.numerator!] ?? 0);
    const d = Number(sums[t.denominator!] ?? 0);
    const f = def.fields.find((x) => x.name === t.field);
    const r = (n / d) * (t.factor ?? 1);
    out[t.field] = !d || !Number.isFinite(r) ? null : f?.type === 'integer' ? Math.round(r) : r.toFixed(f?.scale ?? 2);
  }
  return out;
}

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
 * Totais do rodapé sobre tudo o que o filtro alcança, numa chamada só (as razões saem das mesmas somas). A chave começa com 'c3-list' (gravar ou
 * rodar uma ação relê) e não leva a página: trocar de página não refaz a soma.
 */
export function useListTotals(entity: string, columns: string[], query: ListQuery) {
  const { client, org, entities } = useEngine();
  const def = entities[entity].def;
  const fields = measuredFields(def, columns);
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
  return data ? withRatios(def, columns, readTotals(fields, data)) : undefined;
}

/** Intervalo do SWR para `views.list.refreshSeconds`: 0 desliga; abaixo de 3 s vira 3 s (o schema já recusa). */
export const refreshMs = (seconds?: number) => (seconds ? Math.max(seconds, 3) * 1000 : 0);
