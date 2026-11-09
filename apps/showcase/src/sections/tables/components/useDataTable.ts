import { getCoreRowModel, TableOptions, useReactTable } from '@tanstack/react-table';

import { textFilter } from '@c3theme/ui/table';

export type DataTableOptions<T> = Omit<TableOptions<T>, 'getCoreRowModel'> & Partial<Pick<TableOptions<T>, 'getCoreRowModel'>>;

/**
 * `useReactTable` com os padrões desta área: busca sem acento e sem os resets automáticos
 * de página/expansão (eles disparam antes da montagem e geram aviso do React).
 * Quem muda filtro volta para a primeira página (TableToolbar e ColumnFilter) e a
 * DataPagination corrige uma página que ficou fora do intervalo.
 */
export function useDataTable<T>(options: DataTableOptions<T>) {
  return useReactTable<T>({
    getCoreRowModel: getCoreRowModel(),
    globalFilterFn: textFilter,
    autoResetPageIndex: false,
    autoResetExpanded: false,
    ...options
  });
}
