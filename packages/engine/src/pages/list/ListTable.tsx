import { Fragment, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router';

// material-ui
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowDown2, ArrowRight2 } from 'iconsax-reactjs';

import { tableEdgesSx, TableSkeletonRows } from '@c3theme/ui';
import { useEngine, useText } from '../../context';
import { displayValue, findOption, isNumeric } from '../../format';
import { columnCell } from '../../skeletonShape';
import type { FieldDef, ListExpand, RowAction, Text, WireRecord } from '../../types';
import { ColumnCell, ColumnExtras } from './ColumnCell';
import { EditCell } from './EditCell';
import { hugsLastColumn } from './hugLast';
import { RowActionsCell } from './RowActionsCell';
import { RowPreview } from './RowPreview';
import type { InlineEdit } from './useInlineEdit';
import type { ListTotals } from './useListTotals';

/** Coluna da lista já ligada à definição do campo. */
export interface ListColumn {
  field: string;
  width?: number;
  component?: string;
  label?: Text;
  def: FieldDef;
  extras: ColumnExtras;
  /** Edita na própria linha (`columns[].edit`). */
  edit?: 'instant' | 'batch';
}

/** Coluna "Ações": quais ícones e o que fazer em cada um (ver só navega). */
export interface RowActionsColumn {
  actions: (row: WireRecord) => RowAction[];
  titleOf: (row: WireRecord) => string;
  onView?: (row: WireRecord) => void;
  onEdit: (row: WireRecord) => void;
  onDelete: (rows: WireRecord[]) => void;
  quiet?: boolean;
}

/** Coluna da filial (ou empresa) dona, quando a tela mostra mais de uma. */
export interface OwnerColumn {
  key: '_branch' | '_company';
  label: string;
}

/**
 * Tabela da lista: ordenação pelo cabeçalho, marcação para ação em lote, skeleton no primeiro carregamento
 * e clique na linha para abrir o registro. Com `totals`, um rodapé com a soma de tudo o que o filtro alcança.
 */
export default function ListTable({
  entity,
  columns,
  rows,
  loading,
  skeletonRows,
  owner,
  sort,
  onSort,
  selection,
  totals,
  rowActions,
  expand,
  openable = true,
  onOpen,
  inlineEdit
}: {
  entity: string;
  columns: ListColumn[];
  rows: WireRecord[] | undefined;
  loading: boolean;
  skeletonRows: number;
  owner?: OwnerColumn;
  sort: { field: string; dir: 'asc' | 'desc' };
  onSort: (field: string) => void;
  /** Só quando a entidade tem ação em lote. */
  selection?: { selected: Set<string>; allOnPage: boolean; togglePage: () => void; toggleRow: (row: WireRecord) => void };
  /** Campo → total sobre todo o filtro; só aparece com linhas na tela. */
  totals?: ListTotals;
  rowActions?: RowActionsColumn;
  /** Seta que abre a prévia do registro embaixo da linha. */
  expand?: ListExpand;
  /** Abre o registro no lugar da navegação (diálogo sobre a lista). */
  onOpen?: (row: WireRecord) => void;
  /** false: a linha não abre registro (consulta do sistema). */
  openable?: boolean;
  /** Estado das colunas editáveis (`columns[].edit`). */
  inlineEdit?: InlineEdit;
}) {
  const { components, entities } = useEngine();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggleOpen = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const span = (selection ? 1 : 0) + (expand ? 1 : 0) + (owner ? 1 : 0) + columns.length + (rowActions ? 1 : 0);
  const text = useText();
  const intl = useIntl();
  const navigate = useNavigate();
  const optionLabel = (f: FieldDef) => (v: string) => text(findOption(f, v)?.label, v);
  // custom de campo decide o próprio alinhamento
  const align = (c: ListColumn) => (isNumeric(c.def) && !c.component ? 'right' : 'left');

  return (
    <TableContainer>
      <Table
        size="medium"
        aria-busy={loading || undefined}
        sx={tableEdgesSx({ edges: false, hugLast: Boolean(rowActions) || hugsLastColumn(columns) })}
      >
        <TableHead>
          <TableRow>
            {selection && (
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={selection.allOnPage}
                  indeterminate={selection.selected.size > 0 && !selection.allOnPage}
                  onChange={selection.togglePage}
                  disabled={!rows?.length}
                  slotProps={{ input: { 'aria-label': 'Marcar todos da página' } }}
                />
              </TableCell>
            )}
            {expand && <TableCell padding="checkbox" />}
            {owner && <TableCell>{owner.label}</TableCell>}
            {columns.map((c) => (
              <TableCell key={c.field} align={align(c)} sx={{ width: c.width }} sortDirection={sort.field === c.field ? sort.dir : false}>
                <TableSortLabel
                  active={sort.field === c.field}
                  direction={sort.field === c.field ? sort.dir : 'asc'}
                  onClick={() => onSort(c.field)}
                >
                  {text(c.label ?? c.def.label, c.field)}
                </TableSortLabel>
              </TableCell>
            ))}
            {rowActions && <TableCell align="center">Ações</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && !rows && (
            <TableSkeletonRows
              rows={skeletonRows}
              checkbox={Boolean(selection)}
              columns={[
                ...(expand ? (['check'] as const) : []),
                ...(owner ? (['text'] as const) : []),
                ...columns.map((c) => columnCell(c.def)),
                ...(rowActions ? (['text'] as const) : [])
              ]}
            />
          )}
          {rows?.map((row) => (
            <Fragment key={row.id}>
              <TableRow
                hover
                selected={selection?.selected.has(row.id!)}
                sx={{ cursor: openable ? 'pointer' : undefined }}
                onClick={openable ? () => (onOpen ? onOpen(row) : navigate(`/${entity}/${row.id}`)) : undefined}
              >
                {selection && (
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      size="small"
                      checked={selection.selected.has(row.id!)}
                      onChange={() => selection.toggleRow(row)}
                      slotProps={{ input: { 'aria-label': 'Marcar linha' } }}
                    />
                  </TableCell>
                )}
                {expand && (
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      aria-label={open.has(row.id!) ? 'Ocultar prévia' : 'Mostrar prévia'}
                      aria-expanded={open.has(row.id!)}
                      onClick={() => toggleOpen(row.id!)}
                    >
                      {open.has(row.id!) ? <ArrowDown2 size={16} /> : <ArrowRight2 size={16} />}
                    </IconButton>
                  </TableCell>
                )}
                {owner && (
                  <TableCell>
                    <Typography variant="body2">{row[owner.key]?.title}</Typography>
                  </TableCell>
                )}
                {columns.map((c) => {
                  const cell = (
                    <ColumnCell
                      field={c.def}
                      extras={c.extras}
                      to={`/${entity}/${row.id}`}
                      row={row}
                      component={c.component ? components[c.component] : undefined}
                      locale={intl.locale}
                      optionLabel={optionLabel}
                    />
                  );
                  return (
                    <TableCell key={c.field} align={align(c)} sx={c.edit ? { py: 0.75, minWidth: 140 } : undefined}>
                      {c.edit && inlineEdit ? (
                        <EditCell entity={entity} field={c.def} row={row} mode={c.edit} edit={inlineEdit} readView={cell} />
                      ) : (
                        cell
                      )}
                    </TableCell>
                  );
                })}
                {rowActions && (
                  <TableCell align="center">
                    <RowActionsCell
                      entity={entity}
                      row={row}
                      title={rowActions.titleOf(row)}
                      actions={rowActions.actions(row)}
                      onView={rowActions.onView}
                      onEdit={rowActions.onEdit}
                      quiet={rowActions.quiet}
                      onDelete={rowActions.onDelete}
                    />
                  </TableCell>
                )}
              </TableRow>
              {expand && open.has(row.id!) && (
                <TableRow>
                  <TableCell colSpan={span} sx={{ bgcolor: 'action.hover', p: 3 }}>
                    <RowPreview def={entities[entity].def} expand={expand} row={row} />
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
        {totals && rows && rows.length > 0 && (
          <TableFooter>
            <TableRow>
              {selection && <TableCell padding="checkbox" />}
              {expand && <TableCell padding="checkbox" />}
              {owner && <TableCell />}
              {columns.map((c) => (
                <TableCell key={c.field} align={align(c)} sx={{ color: 'text.primary', fontWeight: 600, fontSize: 'body2.fontSize' }}>
                  {totals[c.field] !== undefined
                    ? displayValue(c.def, totals[c.field], intl.locale, optionLabel(c.def))
                    : c.field === columns.find((x) => totals[x.field] === undefined)?.field
                      ? 'Total'
                      : ''}
                </TableCell>
              ))}
              {rowActions && <TableCell />}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>
  );
}
