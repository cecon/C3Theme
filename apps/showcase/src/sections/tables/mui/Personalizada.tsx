// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

// third-party
import { Edit2, Eye, Trash } from 'iconsax-reactjs';

import { Dot, notify, Panel, SoftIconButton, tableEdgesSx } from '@c3theme/ui';
import { PessoaCell, ProgressoCell, SituacaoChip } from '../components';
import { PESSOAS, TONS_SITUACAO } from '../data';
import { formatarMoeda } from '../format';

// Cabeçalho na cor primária e linhas zebradas
const CelulaTitulo = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.vars.palette.primary.main,
  color: theme.vars.palette.primary.contrastText,
  fontSize: '0.8125rem',
  borderBottom: 0
}));

const LinhaZebrada = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': { backgroundColor: theme.vars.palette.action.hover },
  '&:last-child td, &:last-child th': { border: 0 }
}));

// Linhas em cartões separados
const TabelaCartoes = styled(Table)(({ theme }) => ({
  borderCollapse: 'separate',
  borderSpacing: `0 ${theme.spacing(1)}`,
  '& td': {
    backgroundColor: theme.vars.palette.background.paper,
    borderTop: `1px solid ${theme.vars.palette.divider}`,
    borderBottom: `1px solid ${theme.vars.palette.divider}`
  },
  '& td:first-of-type': { borderLeft: `1px solid ${theme.vars.palette.divider}`, borderRadius: '12px 0 0 12px' },
  '& td:last-of-type': { borderRight: `1px solid ${theme.vars.palette.divider}`, borderRadius: '0 12px 12px 0' },
  '& th': { backgroundColor: 'transparent', borderBottom: 0 }
}));

const zebrada = PESSOAS.slice(40, 48);
const cartoes = PESSOAS.slice(60, 65);

export default function MuiPersonalizada() {
  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Panel flush title="Cabeçalho colorido e linhas zebradas">
          <TableContainer>
            <Table aria-label="Tabela personalizada zebrada" sx={[{ minWidth: 640 }, tableEdgesSx()]}>
              <TableHead>
                <TableRow>
                  <CelulaTitulo>Colaborador</CelulaTitulo>
                  <CelulaTitulo>Cargo</CelulaTitulo>
                  <CelulaTitulo align="right">Salário</CelulaTitulo>
                  <CelulaTitulo>Situação</CelulaTitulo>
                </TableRow>
              </TableHead>
              <TableBody>
                {zebrada.map((p) => (
                  <LinhaZebrada key={p.id}>
                    <TableCell>{p.nome}</TableCell>
                    <TableCell>{p.cargo}</TableCell>
                    <TableCell align="right">{formatarMoeda(p.salario)}</TableCell>
                    <TableCell>
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                        <Dot tone={TONS_SITUACAO[p.situacao]} />
                        <Typography variant="body2">{p.situacao}</Typography>
                      </Stack>
                    </TableCell>
                  </LinhaZebrada>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Panel>
      </Grid>
      <Grid size={12}>
        <Panel
          title="Linhas em cartões"
          subtitle="Espaçamento entre linhas, avatar, progresso e ações"
          sx={{ bgcolor: 'background.default' }}
        >
          <TableContainer>
            <TabelaCartoes aria-label="Tabela em cartões" sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Colaborador</TableCell>
                  <TableCell>Departamento</TableCell>
                  <TableCell sx={{ width: 200 }}>Meta do trimestre</TableCell>
                  <TableCell>Situação</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartoes.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <PessoaCell id={p.id} nome={p.nome} email={p.email} />
                    </TableCell>
                    <TableCell>{p.departamento}</TableCell>
                    <TableCell>
                      <ProgressoCell valor={p.progresso} />
                    </TableCell>
                    <TableCell>
                      <SituacaoChip situacao={p.situacao} />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" sx={{ gap: 0.75, justifyContent: 'flex-end' }}>
                        <SoftIconButton
                          size="small"
                          tone="info"
                          aria-label={`Ver ${p.nome}`}
                          onClick={() => notify(`Abrindo ${p.nome}…`, 'info')}
                        >
                          <Eye size={16} />
                        </SoftIconButton>
                        <SoftIconButton
                          size="small"
                          tone="primary"
                          aria-label={`Editar ${p.nome}`}
                          onClick={() => notify(`Editar ${p.nome}`, 'info')}
                        >
                          <Edit2 size={16} />
                        </SoftIconButton>
                        <SoftIconButton
                          size="small"
                          tone="danger"
                          aria-label={`Excluir ${p.nome}`}
                          onClick={() => notify('Exemplo visual: nada foi excluído.', 'warning')}
                        >
                          <Trash size={16} />
                        </SoftIconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TabelaCartoes>
          </TableContainer>
        </Panel>
      </Grid>
    </Grid>
  );
}
