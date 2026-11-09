// peças genéricas de tabela vêm do pacote; aqui ficam as da vitrine (dados de exemplo, barra, CSV)
export {
  ColumnFilter,
  colLabel,
  colMeta,
  equalsFilter,
  ExpandButton,
  expandColumn,
  pinnedStyle,
  RowCheckbox,
  selectColumn,
  SortHeader,
  TableEmpty,
  TablePagination,
  TableView,
  textFilter
} from '@c3theme/ui/table';
export type { ColMeta, TableViewProps } from '@c3theme/ui/table';
export { default as ColumnVisibilityMenu } from './ColumnVisibilityMenu';
export { default as ConfirmDialog } from './ConfirmDialog';
export { default as CsvButton } from './CsvButton';
export { default as TableToolbar } from './TableToolbar';
export { PessoaCell, ProgressoCell, SituacaoChip } from './cells';
export { colunasPessoa, COLUNAS_PADRAO, meta } from './columns';
export { exportarCsv } from './meta';
export { default as DetalhePessoa } from './DetalhePessoa';
export { useDataTable } from './useDataTable';
export type { DataTableOptions } from './useDataTable';
