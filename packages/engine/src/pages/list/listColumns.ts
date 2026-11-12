import { defaultColumns } from '../../format';
import type { ColumnDef, EntityDef } from '../../types';
import { recordTitle as titleOf } from '../../views';
import type { ListColumn } from './ListTable';

/** Colunas da lista (as da spec ou as por convenção) já ligadas às definições dos campos que cada uma usa. */
export function listColumns(def: EntityDef): ListColumn[] {
  const field = (name: string) => def.fields.find((f) => f.name === name)!;
  return (def.views?.list?.columns ?? defaultColumns(def)).map((c: ColumnDef) => {
    const { secondary, join, avatar, link, href, weight, tone, ...col } = typeof c === 'string' ? { field: c } : c;
    const extras = {
      secondary: secondary ? field(secondary) : undefined,
      join: join?.map(field),
      avatar,
      link,
      href,
      weight,
      tone: tone && { field: field(tone.field), map: tone.map }
    };
    return { ...col, def: field(col.field), extras };
  });
}

/**
 * Colunas que a consulta do sistema pediu (`meta.columns`, #60): só as que vieram, nesta ordem, com o rótulo dado
 * (também no arquivo exportado). Campo fora de `views.list.columns` entra simples. Sem `meta.columns`: as da view.
 */
export function withSourceColumns(
  def: EntityDef,
  columns: ListColumn[],
  wanted: { field: string; label?: string }[] | undefined
): ListColumn[] {
  if (!wanted) return columns;
  return wanted.flatMap(({ field, label }) => {
    const f = def.fields.find((x) => x.name === field);
    if (!f) return [];
    const col = columns.find((c) => c.field === field) ?? { field, def: f, extras: {} };
    return label === undefined ? [col] : [{ ...col, label, def: { ...col.def, label } }];
  });
}

/** Nome do registro para avisos e leitor de tela: o `titleField`, o primeiro texto ou o id. */
// reference no titleField vira o `title` dele, como no formulário (#5)
export function recordTitle(def: EntityDef): (row: Record<string, unknown>) => string {
  return (row) => titleOf(def, row) || String(row.id ?? '');
}
