// Lista do painel com abas, filtro no cartão e mais de 10 linhas, e a variação do KPI (#64). Sem React.

import type { ListTab, ListWidget } from './dashboard';
import type { Condition, EntityDef, EnumValue } from './types';

/** Teto de linhas de uma lista do painel: mais que isso é a lista inteira, pelo "Ver todos". */
export const LIST_MAX = 200;

/** Acima disso o cartão rola por dentro em vez de crescer a página. */
export const LIST_SCROLL_AFTER = 10;

export const listLimit = (w: ListWidget): number => Math.min(Math.max(w.limit ?? 5, 1), LIST_MAX);

/** As abas como widgets prontos para a lista: a entidade e o filtro da aba; colunas, ordem e limite do widget. */
export function listTabs(w: ListWidget): (ListWidget & { label?: ListTab['label'] })[] {
  if (!w.tabs?.length) return [w];
  return w.tabs.map((t) => ({
    ...w,
    tabs: undefined,
    label: t.label,
    entity: t.entity ?? w.entity,
    preset: t.preset,
    where: t.where,
    columns: t.columns ?? w.columns,
    sort: t.sort ?? w.sort
  }));
}

/** O valor escolhido no seletor do cartão como filtro; vazio é "Todos". */
export function localWhere(def: EntityDef, field: string | undefined, value: string): Condition | undefined {
  const f = field ? def.fields.find((x) => x.name === field) : undefined;
  if (!f || value === '') return undefined;
  const typed: EnumValue | boolean =
    f.type === 'boolean' ? value === 'true' : (f.options?.find((o) => String(o.value) === value)?.value ?? value);
  return { field: f.name, op: 'eq', value: typed };
}

/** Variação do KPI sobre a base: % com sinal e se é boa (`invert`: subir é ruim). Base zero: sem %. */
export function variation(value: number, base: number, invert = false): { pct: number; up: boolean; good: boolean } | undefined {
  if (!base) return undefined;
  const pct = ((value - base) / Math.abs(base)) * 100;
  const up = pct > 0;
  return { pct, up, good: pct === 0 || up !== invert };
}
