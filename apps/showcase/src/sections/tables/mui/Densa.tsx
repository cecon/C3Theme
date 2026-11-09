import { useState } from 'react';

// material-ui
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { Panel, tableEdgesSx } from '@c3theme/ui';
import { CsvButton } from '../components';
import { PESSOAS } from '../data';
import { baixarCsv, formatarData, formatarMoeda } from '../format';

const linhas = PESSOAS.slice(10, 30);

function exportar() {
  baixarCsv(
    'tabela-densa',
    ['Código', 'Nome', 'CPF', 'Cargo', 'UF', 'Admissão', 'Salário'],
    linhas.map((p) => [p.id, p.nome, p.cpf, p.cargo, p.uf, formatarData(p.admissao), p.salario])
  );
  return linhas.length;
}

export default function MuiDensa() {
  const [densa, setDensa] = useState(true);
  return (
    <Panel
      flush
      title="Tabela densa"
      subtitle="Mais linhas por tela com células compactas"
      action={
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
          <FormControlLabel control={<Switch checked={densa} onChange={(e) => setDensa(e.target.checked)} />} label="Compacta" />
          <CsvButton compacto onExport={exportar} />
        </Stack>
      }
    >
      <TableContainer>
        <Table size={densa ? 'small' : 'medium'} aria-label="Tabela densa" sx={[{ minWidth: 760 }, tableEdgesSx()]}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>CPF</TableCell>
              <TableCell>Cargo</TableCell>
              <TableCell>UF</TableCell>
              <TableCell>Admissão</TableCell>
              <TableCell align="right">Salário</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {linhas.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell sx={{ color: 'text.secondary' }}>{p.id}</TableCell>
                <TableCell>{p.nome}</TableCell>
                <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{p.cpf}</TableCell>
                <TableCell>{p.cargo}</TableCell>
                <TableCell>{p.uf}</TableCell>
                <TableCell>{formatarData(p.admissao)}</TableCell>
                <TableCell align="right">{formatarMoeda(p.salario)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Panel>
  );
}
