import { defaultColumns } from '../../format';
import type { ColumnDef, EntityDef } from '../../types';
import { recordTitle as titleOf } from '../../views';
import type { ListColumn } from './ListTable';

/** Colunas da lista (as da spec ou as por convenção) já ligadas às definições dos campos que cada uma usa. */
export function listColumns(def: EntityDef): ListColumn[] {
  const field = (name: string) => def.fields.find((f) => f.name === name)!;
  return (def.views?.list?.columns ?? defaultColumns(def)).map((c: ColumnDef) => {
    const { secondary, join, avatar, link, weight, tone, ...col } = typeof c === 'string' ? { field: c } : c;
    const extras = {
      secondary: secondary ? field(secondary) : undefined,
      join: join?.map(field),
      avatar,
      link,
      weight,
      tone: tone && { field: field(tone.field), map: tone.map }
    };
    return { ...col, def: field(col.field), extras };
  });
}

/** Nome do registro para avisos e leitor de tela: o `titleField`, o primeiro texto ou o id. */
// reference no titleField vira o `title` dele, como no formulário (#5)
export function recordTitle(def: EntityDef): (row: Record<string, unknown>) => string {
  return (row) => titleOf(def, row) || String(row.id ?? '');
}
