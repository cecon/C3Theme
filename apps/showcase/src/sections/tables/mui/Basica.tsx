// material-ui
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { Panel, tableEdgesSx } from '@c3theme/ui';
import { CsvButton, SituacaoChip } from '../components';
import { PESSOAS } from '../data';
import { baixarCsv, formatarMoeda } from '../format';

const linhas = PESSOAS.slice(0, 8);
const CABECALHOS = ['Nome', 'Departamento', 'Cidade', 'Salário', 'Situação'];

function exportar() {
  baixarCsv(
    'tabela-simples',
    CABECALHOS,
    linhas.map((p) => [p.nome, p.departamento, `${p.cidade} - ${p.uf}`, p.salario, p.situacao])
  );
  return linhas.length;
}

export default function MuiBasica() {
  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Panel flush title="Tabela simples" subtitle="Linhas e colunas sem interação" action={<CsvButton compacto onExport={exportar} />}>
          <TableContainer>
            <Table aria-label="Tabela simples" sx={[{ minWidth: 640 }, tableEdgesSx()]}>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Departamento</TableCell>
                  <TableCell>Cidade</TableCell>
                  <TableCell align="right">Salário</TableCell>
                  <TableCell>Situação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {linhas.map((p) => (
                  <TableRow key={p.id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell>{p.nome}</TableCell>
                    <TableCell>{p.departamento}</TableCell>
                    <TableCell>
                      {p.cidade} – {p.uf}
                    </TableCell>
                    <TableCell align="right">{formatarMoeda(p.salario)}</TableCell>
                    <TableCell>
                      <SituacaoChip situacao={p.situacao} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Panel>
      </Grid>
    </Grid>
  );
}
