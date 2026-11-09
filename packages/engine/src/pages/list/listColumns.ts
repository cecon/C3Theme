import { defaultColumns } from '../../format';
import type { ColumnDef, EntityDef, FieldDef } from '../../types';
import type { ListColumn } from './ListTable';

/** Colunas da lista (as da spec ou as por convenção) já ligadas às definições dos campos que cada uma usa. */
export function listColumns(def: EntityDef): ListColumn[] {
  const field = (name: string) => def.fields.find((f) => f.name === name)!;
  return (def.views?.list?.columns ?? defaultColumns(def)).map((c: ColumnDef) => {
    const { secondary, join, avatar, link, weight, ...col } = typeof c === 'string' ? { field: c } : c;
    const extras = { secondary: secondary ? field(secondary) : undefined, join: join?.map(field), avatar, link, weight };
    return { ...col, def: field(col.field), extras };
  });
}

/** Nome do registro para avisos e leitor de tela: o `titleField`, o primeiro texto ou o id. */
export function recordTitle(def: EntityDef): (row: Record<string, unknown>) => string {
  const name = def.titleField ?? def.fields.find((f: FieldDef) => f.type === 'string')?.name;
  return (row) => String((name && row[name]) || row.id || '');
}
