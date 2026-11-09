import { useMemo, useState } from 'react';

// material-ui
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { Trash } from 'iconsax-reactjs';

import { notify, Panel, softColors, tableEdgesSx } from '@c3theme/ui';
import { ConfirmDialog, SituacaoChip } from '../components';
import { Pessoa, PESSOAS } from '../data';
import { formatarMoeda } from '../format';
import MuiSortHead, { ColunaMui, proximaOrdem } from './MuiSortHead';
import { ordenar, Sentido } from './shared';

const COLUNAS: ColunaMui<Pessoa>[] = [
  { chave: 'nome', rotulo: 'Nome' },
  { chave: 'departamento', rotulo: 'Departamento' },
  { chave: 'idade', rotulo: 'Idade', align: 'right' },
  { chave: 'salario', rotulo: 'Salário', align: 'right' },
  { chave: 'situacao', rotulo: 'Situação' }
];

export default function MuiAprimorada() {
  const [linhas, setLinhas] = useState(() => PESSOAS.slice(0, 40));
  const [ordem, setOrdem] = useState<{ chave: keyof Pessoa & string; sentido: Sentido }>({ chave: 'nome', sentido: 'asc' });
  const [marcadas, setMarcadas] = useState<Set<number>>(new Set());
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(5);
  const [densa, setDensa] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  const ordenadas = useMemo(() => ordenar(linhas, ordem.chave, ordem.sentido), [linhas, ordem]);
  const visiveis = ordenadas.slice(pagina * porPagina, pagina * porPagina + porPagina);
  const vazias = Math.max(0, porPagina - visiveis.length);

  const alternar = (id: number) =>
    setMarcadas((antes) => {
      const novo = new Set(antes);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });

  const excluir = () => {
    setLinhas((antes) => antes.filter((p) => !marcadas.has(p.id)));
    notify(`${marcadas.size} registro(s) excluído(s).`, 'success');
    setMarcadas(new Set());
    setPagina(0);
  };

  return (
    <Panel flush>
      <Stack
        direction="row"
        sx={(theme) => ({
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: 2.5,
          py: 1.5,
          minHeight: 64,
          ...(marcadas.size > 0 && softColors(theme, 'primary'))
        })}
      >
        {marcadas.size > 0 ? (
          <Typography variant="subtitle1" sx={{ color: 'inherit' }}>
            {marcadas.size} selecionada(s)
          </Typography>
        ) : (
          <Typography variant="h5">Colaboradores</Typography>
        )}
        {marcadas.size > 0 && (
          <Tooltip title="Excluir selecionadas">
            <IconButton color="error" onClick={() => setConfirmar(true)} aria-label="Excluir selecionadas">
              <Trash size={20} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      <TableContainer>
        <Table size={densa ? 'small' : 'medium'} aria-label="Tabela com ordenação e seleção" sx={[{ minWidth: 720 }, tableEdgesSx()]}>
          <MuiSortHead
            colunas={COLUNAS}
            ordem={ordem}
            onOrdenar={(chave) => setOrdem((o) => proximaOrdem(o, chave))}
            selecao={{
              total: linhas.length,
              marcadas: marcadas.size,
              onAlternarTodas: () => setMarcadas(marcadas.size === linhas.length ? new Set() : new Set(linhas.map((p) => p.id)))
            }}
          />
          <TableBody>
            {visiveis.map((p) => {
              const marcada = marcadas.has(p.id);
              return (
                <TableRow
                  key={p.id}
                  hover
                  selected={marcada}
                  onClick={() => alternar(p.id)}
                  sx={{ cursor: 'pointer' }}
                  aria-selected={marcada}
                >
                  <TableCell padding="checkbox" sx={{ pl: 1.5 }}>
                    <Checkbox size="small" checked={marcada} slotProps={{ input: { 'aria-label': `Selecionar ${p.nome}` } }} />
                  </TableCell>
                  <TableCell>{p.nome}</TableCell>
                  <TableCell>{p.departamento}</TableCell>
                  <TableCell align="right">{p.idade}</TableCell>
                  <TableCell align="right">{formatarMoeda(p.salario)}</TableCell>
                  <TableCell>
                    <SituacaoChip situacao={p.situacao} />
                  </TableCell>
                </TableRow>
              );
            })}
            {vazias > 0 && (
              <TableRow sx={{ height: (densa ? 37 : 57) * vazias }}>
                <TableCell colSpan={COLUNAS.length + 1} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2.5 }}>
        <FormControlLabel control={<Switch checked={densa} onChange={(e) => setDensa(e.target.checked)} />} label="Linhas compactas" />
        <TablePagination
          component="div"
          count={linhas.length}
          page={Math.min(pagina, Math.max(0, Math.ceil(linhas.length / porPagina) - 1))}
          rowsPerPage={porPagina}
          rowsPerPageOptions={[5, 10, 25]}
          onPageChange={(_, p) => setPagina(p)}
          onRowsPerPageChange={(e) => {
            setPorPagina(Number(e.target.value));
            setPagina(0);
          }}
        />
      </Stack>
      <ConfirmDialog open={confirmar} titulo="Excluir registros" onClose={() => setConfirmar(false)} onConfirm={excluir}>
        Excluir {marcadas.size} registro(s) selecionado(s)? Esta ação não pode ser desfeita.
      </ConfirmDialog>
    </Panel>
  );
}
