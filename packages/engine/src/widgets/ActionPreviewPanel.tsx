// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import type { PreviewState } from '../hooks/useActionPreview';

const cell = (v: unknown) => (v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v));

/** O que a ação vai fazer, segundo o sistema: texto e tabela só de leitura. Nada foi gravado ainda. */
export default function ActionPreviewPanel({ state }: { state: PreviewState }) {
  const { loading, data, error } = state;
  if (!loading && !data && !error) return null;
  const table = data?.table;
  return (
    <Box sx={{ mt: 2.5 }} aria-live="polite" aria-busy={loading}>
      <LinearProgress sx={{ visibility: loading ? 'visible' : 'hidden', mb: 1 }} />
      {error ? (
        <Alert severity="warning">{`Sem prévia: ${error}`}</Alert>
      ) : (
        data?.message && (
          <Alert severity="info" icon={false}>
            {data.message}
          </Alert>
        )
      )}
      {!error && table && table.rows.length > 0 && (
        <Table size="small" sx={{ mt: 1.5 }} aria-label="Prévia">
          <TableHead>
            <TableRow>
              {table.columns.map((c) => (
                <TableCell key={c.name}>{c.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {table.rows.map((r, i) => (
              // linhas da prévia não têm id: a posição é a identidade
              <TableRow key={i}>
                {table.columns.map((c) => (
                  <TableCell key={c.name}>{cell(r[c.name])}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
