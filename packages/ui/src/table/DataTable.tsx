import { useMemo, useState } from 'react';

// third-party
import { useReactTable } from '@tanstack/react-table';
import type { ColumnDef, PaginationState, RowSelectionState, SortingState } from '@tanstack/react-table';

import { dataTableOptions } from './options';
import { selectColumn } from './RowCheckbox';
import TablePagination from './TablePagination';
import TableView from './TableView';
import type { TableViewProps } from './TableView';

export interface DataTableProps<T> extends Omit<TableViewProps<T>, 'table'> {
  rows: T[];
  columns: ColumnDef<T, any>[];
  /** Chave estável da linha: é por ela que a seleção sobrevive à troca de página. */
  getRowId: (row: T) => string;
  /**
   * Ordenação e paginação feitas pelo backend: a tela recebe `sorting`/`pagination` pelos callbacks, busca a página
   * e devolve `rows` e `total`. Sem `server`, o DataTable ordena e pagina as `rows` na tela.
   */
  server?: boolean;
  /** Total de registros do filtro no backend (obrigatório com `server`). */
  total?: number;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  /** Ordenar por mais de uma coluna com Shift + clique. */
  multiSort?: boolean;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  /** Padrão: [10, 25, 50, 100]. */
  pageSizes?: number[];
  /** false: sem paginação (lista curta, ou rolagem com `stickyHeader` e `maxHeight`). */
  paginate?: boolean;
  /** Com `rowSelection` ou `onRowSelectionChange`, entra a coluna de marcar. Chaves são os ids de `getRowId`. */
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
}

/** Só as props de apresentação, que vão para o TableView. */
function viewProps<T>(p: Partial<DataTableProps<T>>): Omit<TableViewProps<T>, 'table'> {
  const { dense, striped, bordered, stickyHeader, maxHeight, showFilters, showFooter, fixedLayout, renderDetail, empty, minWidth } = p;
  const { onRowClick, ariaLabel, loading } = p;
  return {
    dense,
    striped,
    bordered,
    stickyHeader,
    maxHeight,
    showFilters,
    showFooter,
    fixedLayout,
    renderDetail,
    empty,
    minWidth,
    onRowClick,
    ariaLabel,
    loading
  };
}

/** Estado controlado quando a tela passa o valor; senão, guardado aqui. */
function useControllable<S>(value: S | undefined, onChange: ((v: S) => void) | undefined, initial: S): [S, (v: S) => void] {
  const [local, setLocal] = useState(initial);
  const current = value ?? local;
  return [
    current,
    (v: S) => {
      if (value === undefined) setLocal(v);
      onChange?.(v);
    }
  ];
}

/**
 * Tabela de dados pronta: TanStack por dentro, mas a tela só passa linhas, colunas e o estado que quer controlar.
 * Para o que esta API não cobre (agrupamento, colunas fixas, redimensionar), monte o `useReactTable` e use
 * `TableView` com `TablePagination`.
 */
export default function DataTable<T>(props: DataTableProps<T>) {
  const { rows, columns, getRowId, server, total, multiSort, pageSizes = [10, 25, 50, 100], paginate = true } = props;
  const { sorting: sortingProp, onSortingChange, pagination: paginationProp, onPaginationChange } = props;
  const { rowSelection: selectionProp, onRowSelectionChange } = props;
  const selectable = selectionProp !== undefined || onRowSelectionChange !== undefined;
  const [sorting, setSorting] = useControllable(sortingProp, onSortingChange, []);
  const [pagination, setPagination] = useControllable(paginationProp, onPaginationChange, { pageIndex: 0, pageSize: pageSizes[0] });
  const [rowSelection, setRowSelection] = useControllable(selectionProp, onRowSelectionChange, {});
  const allColumns = useMemo(() => (selectable ? [selectColumn<T>(), ...columns] : columns), [selectable, columns]);

  const table = useReactTable(
    dataTableOptions(
      { rows, columns: allColumns, getRowId, server, total, multiSort, paginate, selectable, facets: Boolean(props.showFilters) },
      { sorting, pagination, rowSelection, setSorting, setPagination, setRowSelection }
    )
  );

  return (
    <>
      <TableView table={table} {...viewProps(props)} />
      {paginate && <TablePagination table={table} pageSizes={pageSizes} />}
    </>
  );
}
