import { Fragment, ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import type { SystemStyleObject } from '@mui/system';
import type { Theme } from '@mui/material/styles';

// third-party
import { flexRender } from '@tanstack/react-table';
import type { Cell, Column, Header, Row, Table as TanTable } from '@tanstack/react-table';

import { tableEdgesSx } from '../components/tableEdges';
import { useUiText } from '../i18n';
import ColumnFilter from './ColumnFilter';
import { ExpandButton } from './ExpandButton';
import SortHeader from './SortHeader';
import TableEmpty from './TableEmpty';
import { colMeta } from './meta';

export interface TableViewProps<T> {
  table: TanTable<T>;
  dense?: boolean;
  /** Linhas zebradas. */
  striped?: boolean;
  /** Bordas verticais entre células (útil com cabeçalho agrupado). */
  bordered?: boolean;
  /** Cabeçalho fixo ao rolar; use junto com `maxHeight`. */
  stickyHeader?: boolean;
  maxHeight?: number | string;
  /** Linha de filtros por coluna logo abaixo do cabeçalho. */
  showFilters?: boolean;
  /** Renderiza os `footer` das colunas. */
  showFooter?: boolean;
  /** Usa as larguras das colunas (redimensionamento). */
  fixedLayout?: boolean;
  /** Painel de detalhe mostrado abaixo da linha expandida. */
  renderDetail?: (row: Row<T>) => ReactNode;
  /** Conteúdo quando não há linhas; padrão: estado vazio genérico. */
  empty?: ReactNode;
  minWidth?: number;
  onRowClick?: (row: Row<T>) => void;
  ariaLabel?: string;
  /** Barra de progresso sob o cabeçalho e linhas esmaecidas enquanto a página carrega. */
  loading?: boolean;
}

/** Estilo de coluna fixa (pinning) à esquerda ou à direita, com sombra na borda. */
export function pinnedStyle<T>(column: Column<T, unknown>, header = false): (theme: Theme) => SystemStyleObject<Theme> {
  const side = column.getIsPinned();
  if (!side) return () => ({});
  const lastLeft = side === 'left' && column.getIsLastColumn('left');
  const firstRight = side === 'right' && column.getIsFirstColumn('right');
  return (theme: Theme) => ({
    position: 'sticky' as const,
    zIndex: header ? theme.zIndex.raised + 2 : theme.zIndex.raised,
    bgcolor: header ? theme.vars.palette.background.default : theme.vars.palette.background.paper,
    ...(side === 'left' ? { left: column.getStart('left') } : { right: column.getAfter('right') }),
    ...(lastLeft && { boxShadow: `inset -1px 0 0 ${theme.vars.palette.divider}, 4px 0 6px -4px rgb(0 0 0 / 0.18)` }),
    ...(firstRight && { boxShadow: `inset 1px 0 0 ${theme.vars.palette.divider}, -4px 0 6px -4px rgb(0 0 0 / 0.18)` })
  });
}

function ResizeHandle<T>({ header }: { header: Header<T, unknown> }) {
  const t = useUiText();
  const active = header.column.getIsResizing();
  const { table } = header.getContext();
  // no modo "ao soltar", a linha guia acompanha o mouse até soltar
  const offset = active && table.options.columnResizeMode === 'onEnd' ? (table.getState().columnSizingInfo.deltaOffset ?? 0) : 0;
  return (
    <Box
      role="separator"
      aria-orientation="vertical"
      aria-label={t('c3.table.resize')}
      onDoubleClick={() => header.column.resetSize()}
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        height: '100%',
        width: 6,
        cursor: 'col-resize',
        userSelect: 'none',
        touchAction: 'none',
        bgcolor: active ? 'primary.main' : 'divider',
        opacity: active ? 1 : 0,
        transition: 'opacity .15s',
        transform: `translateX(${offset}px)`,
        '&:hover': { opacity: 1 }
      }}
    />
  );
}

function BodyCell<T>({ cell }: { cell: Cell<T, unknown> }) {
  const t = useUiText();
  const row = cell.row;
  if (cell.getIsGrouped()) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <ExpandButton
          open={row.getIsExpanded()}
          onClick={row.getToggleExpandedHandler()}
          label={t(row.getIsExpanded() ? 'c3.table.collapseGroup' : 'c3.table.expandGroup')}
        />
        <Typography variant="subtitle2" component="span">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="span">
          ({row.subRows.length})
        </Typography>
      </Box>
    );
  }
  // sub-linhas (getSubRows) também contam como "agregadas" no TanStack: só vale com agrupamento ativo
  if (cell.getIsAggregated() && cell.getContext().table.getState().grouping.length > 0) {
    return <>{flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext())}</>;
  }
  if (cell.getIsPlaceholder()) return null;
  return <>{flexRender(cell.column.columnDef.cell, cell.getContext())}</>;
}

/**
 * Renderização de uma tabela TanStack com os componentes do MUI (o `DataTable` monta a tabela e usa esta):
 * cabeçalhos agrupados e ordenáveis, filtros por coluna, colunas fixas, redimensionamento,
 * agrupamento, linhas de detalhe, rodapé e estado vazio.
 */
export default function TableView<T>({
  table,
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
}: TableViewProps<T>) {
  const t = useUiText();
  const rows = table.getRowModel().rows;
  const leafHeaders = table.getLeafHeaders();
  const visibleColumns = table.getVisibleLeafColumns().length;

  return (
    <TableContainer sx={{ maxHeight, overflow: 'auto' }}>
      <Table
        size={dense ? 'small' : 'medium'}
        aria-label={ariaLabel}
        sx={[
          { minWidth },
          fixedLayout ? { tableLayout: 'fixed', width: table.getTotalSize(), minWidth: '100%' } : {},
          striped ? { '& tbody tr:nth-of-type(even):not(.Mui-selected)': { bgcolor: 'action.hover' } } : {},
          bordered
            ? { '& th, & td': { borderRight: 1, borderColor: 'divider' }, '& th:last-child, & td:last-child': { borderRight: 0 } }
            : {},
          // bordas alinhadas ao card; sem larguras fixas, a última coluna abraça o conteúdo e a sobra vai para o texto
          tableEdgesSx({ hugLast: !fixedLayout }),
          // células em uma linha só; a tabela rola na horizontal quando falta espaço
          { '& > tbody > tr > td': { whiteSpace: 'nowrap' } }
        ]}
      >
        <TableHead sx={stickyHeader ? { position: 'sticky', top: 0, zIndex: 'sticky' } : undefined}>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => {
                const meta = colMeta(header.column);
                const grouping = header.subHeaders.length > 0 && !header.isPlaceholder;
                return (
                  <TableCell
                    key={header.id}
                    colSpan={header.colSpan}
                    align={grouping ? 'center' : meta.align}
                    sx={[
                      { position: 'relative' },
                      fixedLayout ? { width: header.getSize() } : {},
                      grouping ? { borderBottom: 1, borderColor: 'divider' } : {},
                      pinnedStyle(header.column, true)
                    ]}
                  >
                    <SortHeader header={header} />
                    {fixedLayout && table.options.enableColumnResizing && header.column.getCanResize() && !grouping && (
                      <ResizeHandle header={header} />
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
          {loading && (
            <TableRow>
              {/* td, não th: é a faixa de carregando, não um cabeçalho de coluna */}
              <TableCell component="td" colSpan={visibleColumns} sx={{ p: 0, borderBottom: 0 }}>
                <LinearProgress sx={{ height: 2 }} aria-label={t('c3.loading')} />
              </TableCell>
            </TableRow>
          )}
          {showFilters && (
            <TableRow>
              {leafHeaders
                .filter((h) => h.column.getIsVisible())
                .map((header) => (
                  <TableCell key={header.id} sx={[{ py: 1, bgcolor: 'background.paper' }, pinnedStyle(header.column, true)]}>
                    {header.column.getCanFilter() && header.column.accessorFn ? (
                      <ColumnFilter column={header.column} table={table} />
                    ) : null}
                  </TableCell>
                ))}
            </TableRow>
          )}
        </TableHead>

        {/* sem esmaecer as linhas: com opacidade o texto caía abaixo de 4,5:1; a faixa de cima já mostra que carrega */}
        <TableBody aria-busy={loading || undefined}>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={visibleColumns} sx={{ borderBottom: 0, whiteSpace: 'normal !important' }}>
                {loading ? null : (empty ?? <TableEmpty description={t('c3.table.emptyHint')} />)}
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <Fragment key={row.id}>
              <TableRow
                hover
                selected={row.getIsSelected()}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={[
                  onRowClick ? { cursor: 'pointer' } : {},
                  row.getIsGrouped() ? { bgcolor: 'action.hover' } : {},
                  renderDetail && row.getIsExpanded() ? { '& > td': { borderBottom: 0 } } : {}
                ]}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    align={colMeta(cell.column).align}
                    sx={[
                      fixedLayout ? { width: cell.column.getSize(), overflow: 'hidden', textOverflow: 'ellipsis' } : {},
                      pinnedStyle(cell.column)
                    ]}
                  >
                    <BodyCell cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
              {renderDetail && row.getIsExpanded() && (
                <TableRow>
                  <TableCell colSpan={row.getVisibleCells().length} sx={{ p: '0 !important', whiteSpace: 'normal !important' }}>
                    {renderDetail(row)}
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>

        {showFooter && (
          <TableFooter>
            {table.getFooterGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    colSpan={header.colSpan}
                    align={colMeta(header.column).align}
                    sx={[{ fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }, pinnedStyle(header.column)]}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableFooter>
        )}
      </Table>
    </TableContainer>
  );
}
