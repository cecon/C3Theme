import type { Row, Table } from '@tanstack/react-table';

import { colLabel, colMeta } from '@c3theme/ui/table';
import { baixarCsv } from '../format';

/** Colunas que entram no CSV: visíveis e com dado (sem seleção, ações, alça de arrastar). */
export function colunasExportaveis<T>(table: Table<T>) {
  return table.getVisibleLeafColumns().filter((c) => c.accessorFn !== undefined);
}

/**
 * Exporta para CSV as linhas como aparecem na tabela (filtradas e ordenadas, todas as páginas),
 * ou só as `linhas` passadas (ex.: as selecionadas).
 */
export function exportarCsv<T>(table: Table<T>, arquivo: string, linhas?: Row<T>[]) {
  const colunas = colunasExportaveis(table);
  const fonte = linhas ?? table.getPrePaginationRowModel().flatRows.filter((r) => !r.getIsGrouped());
  baixarCsv(
    arquivo,
    colunas.map((c) => colLabel(c)),
    fonte.map((r) =>
      colunas.map((c) => {
        const valor = r.getValue<unknown>(c.id);
        const meta = colMeta(c);
        if (meta.csv) return meta.csv(valor);
        return typeof valor === 'number' || typeof valor === 'boolean' ? valor : valor == null ? '' : String(valor);
      })
    )
  );
  return fonte.length;
}
