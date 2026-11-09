// Página registrada de exemplo (app.json pages[] com component 'balcao'): o comportamento é código do sistema; o que
// varia por loja (teclas, colunas, texto do caixa livre) chega em `config`, validado por
// spec/v0/examples/components/balcao.schema.json. A shell só monta layout, tema, menu e permissão.

// material-ui
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import type { CustomPageProps } from '@c3theme/engine';

const LABELS: Record<string, string> = { descricao: 'Descrição', quantidade: 'Qtd.', unitario: 'Unitário', total: 'Total' };

export default function Balcao({ config }: CustomPageProps) {
  const columns = (config.columns as string[] | undefined) ?? [];
  const keys = Object.entries((config.keys as Record<string, string> | undefined) ?? {});
  return (
    <Stack spacing={2}>
      <Typography variant="h4">{String(config.greeting ?? 'Caixa livre')}</Typography>
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c}>{LABELS[c] ?? c}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Typography variant="body2" color="text.secondary">
                  Nenhum item lançado.
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
      <Stack direction="row" spacing={1}>
        {keys.map(([key, action]) => (
          <Chip key={key} variant="outlined" label={`${key} ${action}`} />
        ))}
      </Stack>
    </Stack>
  );
}
