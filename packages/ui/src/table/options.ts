// Opções do TanStack para o DataTable, sem React: modo servidor ou cliente, estado controlado e seleção.

import { getCoreRowModel, getFacetedMinMaxValues, getFacetedRowModel, getFacetedUniqueValues } from '@tanstack/react-table';
import { getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/react-table';
import type { ColumnDef, PaginationState, RowSelectionState, SortingState, TableOptions, Updater } from '@tanstack/react-table';

import { textFilter } from './meta';

/** Aplica um `Updater` do TanStack (valor ou função do valor anterior). */
export const applyUpdater = <S>(updater: Updater<S>, current: S): S =>
  typeof updater === 'function' ? (updater as (old: S) => S)(current) : updater;

export interface DataTableState {
  sorting: SortingState;
  pagination: PaginationState;
  rowSelection: RowSelectionState;
  setSorting: (s: SortingState) => void;
  setPagination: (p: PaginationState) => void;
  setRowSelection: (s: RowSelectionState) => void;
}

export interface DataTableConfig<T> {
  rows: T[];
  /** Colunas já com a de seleção, quando houver. */
  columns: ColumnDef<T, any>[];
  getRowId: (row: T) => string;
  server?: boolean;
  total?: number;
  multiSort?: boolean;
  paginate: boolean;
  selectable: boolean;
  facets: boolean;
}

/**
 * Monta as opções: no servidor, ordenação, paginação e filtro são manuais e o total vem do backend (`rowCount`);
 * no cliente, o TanStack ordena, filtra e pagina as `rows`. Trocar a ordenação volta para a primeira página, nos
 * dois modos, para o usuário não cair no meio de uma lista que mudou.
 */
export function dataTableOptions<T>(config: DataTableConfig<T>, state: DataTableState): TableOptions<T> {
  const { rows, columns, getRowId, server, total, multiSort, paginate, selectable, facets } = config;
  return {
    data: rows,
    columns,
    getRowId: (row) => getRowId(row),
    state: {
      sorting: state.sorting,
      rowSelection: state.rowSelection,
      ...(paginate ? { pagination: state.pagination } : {})
    },
    onSortingChange: (u) => {
      state.setSorting(applyUpdater(u, state.sorting));
      if (paginate && state.pagination.pageIndex !== 0) state.setPagination({ ...state.pagination, pageIndex: 0 });
    },
    onPaginationChange: (u) => state.setPagination(applyUpdater(u, state.pagination)),
    onRowSelectionChange: (u) => state.setRowSelection(applyUpdater(u, state.rowSelection)),
    enableRowSelection: selectable,
    enableMultiSort: Boolean(multiSort),
    globalFilterFn: textFilter,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    ...(server
      ? { manualSorting: true, manualPagination: true, manualFiltering: true, rowCount: total ?? rows.length }
      : {
          getSortedRowModel: getSortedRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          ...(paginate ? { getPaginationRowModel: getPaginationRowModel() } : {}),
          ...(facets
            ? {
                getFacetedRowModel: getFacetedRowModel(),
                getFacetedUniqueValues: getFacetedUniqueValues(),
                getFacetedMinMaxValues: getFacetedMinMaxValues()
              }
            : {})
        })
  };
}
