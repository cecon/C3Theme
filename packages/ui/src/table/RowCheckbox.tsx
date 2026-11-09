import type { MutableRefObject, Ref } from 'react';

// material-ui
import Checkbox from '@mui/material/Checkbox';
import type { CheckboxProps } from '@mui/material/Checkbox';

// third-party
import type { ColumnDef, Row, Table } from '@tanstack/react-table';

import { useUiText } from '../i18n';

/**
 * Caixa de seleção compacta para cabeçalho e linhas. O "em parte" vai para o `indeterminate` nativo do input, que o
 * leitor de tela anuncia como misto; o `aria-checked="mixed"` que o MUI põe não vale em checkbox nativo (axe).
 */
export function RowCheckbox({ indeterminate, slotProps, ...props }: CheckboxProps) {
  const input = slotProps?.input && typeof slotProps.input === 'object' ? slotProps.input : {};
  // compõe com o ref de quem usa (slotProps.input.ref), em vez de trocá-lo
  const outer = (input as { ref?: Ref<HTMLInputElement> }).ref;
  const ref = (el: HTMLInputElement | null) => {
    if (el) el.indeterminate = Boolean(indeterminate);
    if (typeof outer === 'function') outer(el);
    else if (outer) (outer as MutableRefObject<HTMLInputElement | null>).current = el;
  };
  return (
    <Checkbox
      size="small"
      sx={{ p: 0.5 }}
      {...props}
      indeterminate={indeterminate}
      slotProps={{ ...slotProps, input: { ...input, 'aria-checked': undefined, ref } }}
    />
  );
}

function SelectPage<T>({ table }: { table: Table<T> }) {
  const t = useUiText();
  return (
    <RowCheckbox
      checked={table.getIsAllPageRowsSelected()}
      indeterminate={table.getIsSomePageRowsSelected()}
      onChange={table.getToggleAllPageRowsSelectedHandler()}
      slotProps={{ input: { 'aria-label': t('c3.table.selectAll') } }}
    />
  );
}

function SelectRow<T>({ row, table }: { row: Row<T>; table: Table<T> }) {
  const t = useUiText();
  // posição na tela (página e ordem atuais), não o índice nos dados, que no servidor recomeça a cada página
  const { pageIndex, pageSize } = table.getState().pagination;
  const offset = table.options.getPaginationRowModel || table.options.manualPagination ? pageIndex * pageSize : 0;
  const position = offset + table.getRowModel().rows.indexOf(row) + 1;
  return (
    <RowCheckbox
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      indeterminate={row.getIsSomeSelected()}
      onChange={row.getToggleSelectedHandler()}
      onClick={(e) => e.stopPropagation()}
      slotProps={{ input: { 'aria-label': t('c3.table.selectRow', { index: position }) } }}
    />
  );
}

/**
 * Coluna de seleção. O cabeçalho marca as linhas da página que está na tela, que é o que o usuário vê; marcar
 * tudo o que o filtro alcança no servidor pede outro contrato (ids x filtro) e fica com a tela.
 */
export function selectColumn<T>(): ColumnDef<T> {
  return {
    id: 'select',
    header: ({ table }) => <SelectPage table={table} />,
    cell: ({ row, table }) => <SelectRow row={row} table={table} />,
    size: 48,
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
    enableResizing: false,
    enableGrouping: false
  };
}
