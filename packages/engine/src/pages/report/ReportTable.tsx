import { useIntl } from 'react-intl';

// material-ui
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { useText } from '../../context';
import { displayValue, findOption } from '../../format';
import type { ReportLine, Sums } from '../../report';
import type { FieldDef } from '../../types';
import { Cell } from '../list/Cell';
import { negativeSx } from '../../rowStyle';

const numeric = (f: FieldDef) => f.type === 'integer' || f.type === 'decimal';

/**
 * Tabela do relatório: cabeçalho de grupo, linhas, subtotal e total geral. O nome do grupo fica na primeira coluna
 * (o spec:check não deixa somar nela). Recuo pelo nível do grupo ou pela profundidade da árvore.
 */
export default function ReportTable({
  columns,
  lines,
  rowSx
}: {
  columns: FieldDef[];
  lines: ReportLine[];
  /** Destaque da linha de registro (`rowStyles`). */
  rowSx?: (row: Record<string, unknown>) => object | undefined;
}) {
  const text = useText();
  const { locale } = useIntl();
  const optionLabel = (f: FieldDef) => (v: string) => text(findOption(f, v)?.label, v);
  const groupLevels = lines.reduce((n, l) => (l.kind === 'group' ? Math.max(n, l.level + 1) : n), 0);
  const sumCells = (sums: Sums) =>
    columns.slice(1).map((f) => (
      <TableCell
        key={f.name}
        align={numeric(f) ? 'right' : 'left'}
        sx={[{ fontVariantNumeric: 'tabular-nums' }, negativeSx(f, sums[f.name])]}
      >
        {f.name in sums ? displayValue(f, sums[f.name], locale, () => '') : ''}
      </TableCell>
    ));

  return (
    <Table size="small" sx={{ '@media print': { '& td, & th, & td .MuiTypography-root': { py: 0.25, fontSize: 11 } } }}>
      <TableHead>
        <TableRow>
          {columns.map((f) => (
            <TableCell key={f.name} align={numeric(f) ? 'right' : 'left'}>
              {text(f.label, f.name)}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {lines.map((l, i) => {
          if (l.kind === 'group')
            return (
              <TableRow key={i} sx={{ bgcolor: l.level === 0 ? 'action.hover' : undefined, breakAfter: 'avoid' }}>
                <TableCell colSpan={columns.length} sx={{ pl: 2 + l.level * 2, fontWeight: 600 }}>
                  {l.label}
                </TableCell>
              </TableRow>
            );
          if (l.kind === 'row')
            return (
              <TableRow key={i} sx={{ breakInside: 'avoid', ...rowSx?.(l.row) }}>
                {columns.map((f, c) => (
                  <TableCell
                    key={f.name}
                    align={numeric(f) ? 'right' : 'left'}
                    sx={c === 0 ? { pl: 2 + (groupLevels + l.depth) * 2 } : undefined}
                  >
                    <Cell field={f} row={l.row} locale={locale} optionLabel={optionLabel(f)} />
                  </TableCell>
                ))}
              </TableRow>
            );
          const total = l.kind === 'total';
          return (
            <TableRow key={i} sx={{ '& td': { fontWeight: 600, borderBottomWidth: total ? 0 : undefined }, breakBefore: 'avoid' }}>
              <TableCell sx={{ pl: total ? 2 : 2 + l.level * 2 }}>
                {total ? `Total geral (${l.count})` : `Subtotal ${l.label} (${l.count})`}
              </TableCell>
              {sumCells(l.sums)}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
