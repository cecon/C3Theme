// Linha "Saldo anterior" no topo da lista (`views.list.opening`): o rótulo na primeira coluna que não é a do saldo.
import { useIntl } from 'react-intl';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import { displayValue, isNumeric } from '../../format';
import type { ListColumn } from './ListTable';

export function OpeningRow({
  opening,
  columns,
  lead,
  trail
}: {
  opening: { field: string; value: number | string; label: string };
  columns: ListColumn[];
  /** Colunas antes das do campo (marcação, prévia, filial). */
  lead: number;
  /** Tem a coluna "Ações" no fim. */
  trail: boolean;
}) {
  const intl = useIntl();
  const labelAt = columns.find((c) => c.field !== opening.field)?.field;
  const sx = { fontWeight: 600, bgcolor: 'action.hover' };
  return (
    <TableRow data-testid="opening-row">
      {lead > 0 && <TableCell colSpan={lead} sx={sx} />}
      {columns.map((c) => (
        <TableCell key={c.field} align={isNumeric(c.def) && !c.component ? 'right' : 'left'} sx={sx}>
          {c.field === opening.field ? displayValue(c.def, opening.value, intl.locale, (v) => v) : c.field === labelAt ? opening.label : ''}
        </TableCell>
      ))}
      {trail && <TableCell sx={sx} />}
    </TableRow>
  );
}
