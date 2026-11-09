// material-ui
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

/** O gráfico como tabela: o mesmo dado para quem não lê o desenho (leitor de tela, impressão, valor exato). */
export default function ChartTable({ labels, values }: { labels: string[]; values: string[] }) {
  return (
    <Table size="small">
      <TableBody>
        {labels.map((l, i) => (
          <TableRow key={`${l}-${i}`}>
            <TableCell component="th" scope="row">
              {l}
            </TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {values[i]}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
