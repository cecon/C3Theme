// material-ui
import Box from '@mui/material/Box';
import TableSortLabel from '@mui/material/TableSortLabel';

// third-party
import { flexRender } from '@tanstack/react-table';
import type { Header } from '@tanstack/react-table';

import { useUiText } from '../i18n';

/**
 * Conteúdo de um cabeçalho do TanStack: rótulo e, quando a coluna ordena, a seta de ordenação.
 * Com mais de uma coluna ordenada (Shift + clique), mostra a prioridade de cada uma.
 */
export default function SortHeader<T>({ header }: { header: Header<T, unknown> }) {
  const t = useUiText();
  if (header.isPlaceholder) return null;
  const label = flexRender(header.column.columnDef.header, header.getContext());
  if (!header.column.getCanSort()) return <>{label}</>;

  const direction = header.column.getIsSorted();
  const table = header.getContext().table;
  const multiple = table.getState().sorting.length > 1;
  const title = t(direction === 'asc' ? 'c3.table.sortAsc' : direction === 'desc' ? 'c3.table.sortDesc' : 'c3.table.sortNone');

  return (
    <TableSortLabel
      active={!!direction}
      direction={direction || 'asc'}
      onClick={header.column.getToggleSortingHandler()}
      title={table.options.enableMultiSort === false ? title : `${title}. ${t('c3.table.sortMulti')}`}
    >
      {label}
      {multiple && direction && (
        <Box
          component="span"
          sx={{
            ml: 0.5,
            minWidth: 16,
            height: 16,
            px: 0.5,
            borderRadius: 8,
            fontSize: '0.625rem',
            lineHeight: '16px',
            textAlign: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText'
          }}
        >
          {header.column.getSortIndex() + 1}
        </Box>
      )}
    </TableSortLabel>
  );
}
