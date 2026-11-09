import { useMemo, useState } from 'react';

// material-ui
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';

// third-party
import { SearchNormal1, Trash } from 'iconsax-reactjs';

import { notify, Panel, SoftIconButton, tableEdgesSx } from '@c3theme/ui';
import { ConfirmDialog, CsvButton, TableEmpty, PessoaCell, SituacaoChip } from '../components';
import { DEPARTAMENTOS, Pessoa, PESSOAS } from '../data';
import { baixarCsv, formatarData, formatarMoeda, normalizar } from '../format';
import MuiSortHead, { ColunaMui, proximaOrdem } from './MuiSortHead';
import { ordenar, Sentido } from './shared';

const COLUNAS: ColunaMui<Pessoa>[] = [
  { chave: 'nome', rotulo: 'Colaborador' },
  { chave: 'departamento', rotulo: 'Departamento' },
  { chave: 'cidade', rotulo: 'Cidade' },
  { chave: 'admissao', rotulo: 'Admissão' },
  { chave: 'salario', rotulo: 'Salário', align: 'right' },
  { chave: 'situacao', rotulo: 'Situação' },
  { chave: 'id', rotulo: 'Ações', align: 'right', ordenavel: false }
];

export default function MuiTabelaDeDados() {
  const [linhas, setLinhas] = useState(() => PESSOAS);
  const [busca, setBusca] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [ordem, setOrdem] = useState<{ chave: keyof Pessoa & string; sentido: Sentido }>({ chave: 'admissao', sentido: 'desc' });
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(10);
  const [excluindo, setExcluindo] = useState<Pessoa | null>(null);

  const filtradas = useMemo(() => {
    const termo = normalizar(busca.trim());
    const lista = linhas.filter(
      (p) =>
        (!departamento || p.departamento === departamento) &&
        (!termo || normalizar(`${p.nome} ${p.email} ${p.cidade} ${p.cargo}`).includes(termo))
    );
    return ordenar(lista, ordem.chave, ordem.sentido);
  }, [linhas, busca, departamento, ordem]);

  const paginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const paginaAtual = Math.min(pagina, paginas - 1);
  const visiveis = filtradas.slice(paginaAtual * porPagina, paginaAtual * porPagina + porPagina);

  const exportar = () => {
    baixarCsv(
      'colaboradores',
      ['Nome', 'E-mail', 'Departamento', 'Cidade', 'UF', 'Admissão', 'Salário', 'Situação'],
      filtradas.map((p) => [p.nome, p.email, p.departamento, p.cidade, p.uf, formatarData(p.admissao), p.salario, p.situacao])
    );
    return filtradas.length;
  };

  return (
    <Panel flush>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5, px: 2.5, py: 2, alignItems: { sm: 'center' } }}>
        <TextField
          label="Buscar"
          size="small"
          placeholder="Nome, e-mail, cidade ou cargo"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(0);
          }}
          sx={{ flex: 1, maxWidth: { sm: 360 } }}
          slotProps={{
            htmlInput: { 'aria-label': 'Buscar colaboradores' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchNormal1 size={16} />
                </InputAdornment>
              )
            }
          }}
        />
        <TextField
          select
          size="small"
          label="Departamento"
          value={departamento}
          onChange={(e) => {
            setDepartamento(e.target.value);
            setPagina(0);
          }}
          sx={{ minWidth: 180 }}
          slotProps={{ select: { displayEmpty: true } }}
        >
          <MenuItem value="">Todos</MenuItem>
          {DEPARTAMENTOS.map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </TextField>
        <Stack direction="row" sx={{ ml: { sm: 'auto' } }}>
          <CsvButton onExport={exportar} />
        </Stack>
      </Stack>
      <TableContainer>
        <Table aria-label="Colaboradores" sx={[{ minWidth: 900 }, tableEdgesSx()]}>
          <MuiSortHead colunas={COLUNAS} ordem={ordem} onOrdenar={(chave) => setOrdem((o) => proximaOrdem(o, chave))} />
          <TableBody>
            {visiveis.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUNAS.length}>
                  <TableEmpty title="Nenhum colaborador encontrado" description="Tente outro termo de busca ou departamento." />
                </TableCell>
              </TableRow>
            )}
            {visiveis.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>
                  <PessoaCell id={p.id} nome={p.nome} email={p.email} />
                </TableCell>
                <TableCell>{p.departamento}</TableCell>
                <TableCell>
                  {p.cidade} – {p.uf}
                </TableCell>
                <TableCell>{formatarData(p.admissao)}</TableCell>
                <TableCell align="right">{formatarMoeda(p.salario)}</TableCell>
                <TableCell>
                  <SituacaoChip situacao={p.situacao} />
                </TableCell>
                <TableCell align="right">
                  <SoftIconButton tone="danger" size="small" aria-label={`Excluir ${p.nome}`} onClick={() => setExcluindo(p)}>
                    <Trash size={16} />
                  </SoftIconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filtradas.length}
        page={paginaAtual}
        rowsPerPage={porPagina}
        rowsPerPageOptions={[10, 25, 50]}
        onPageChange={(_, p) => setPagina(p)}
        onRowsPerPageChange={(e) => {
          setPorPagina(Number(e.target.value));
          setPagina(0);
        }}
        showFirstButton
        showLastButton
        sx={{ borderTop: 1, borderColor: 'divider' }}
      />
      <ConfirmDialog
        open={!!excluindo}
        titulo="Excluir colaborador"
        onClose={() => setExcluindo(null)}
        onConfirm={() => {
          if (!excluindo) return;
          setLinhas((antes) => antes.filter((p) => p.id !== excluindo.id));
          notify(`${excluindo.nome} foi excluído(a).`, 'success');
        }}
      >
        Excluir {excluindo?.nome} da lista?
      </ConfirmDialog>
    </Panel>
  );
}
