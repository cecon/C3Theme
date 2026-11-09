import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

// material-ui
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

// third-party
import { ColumnDef, flexRender, getFilteredRowModel, getSortedRowModel, SortingState, Table as TanTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

import { Panel } from '@c3theme/ui';
import { colMeta, colunasPessoa, TableEmpty, SortHeader, TableToolbar, useDataTable } from '../components';
import { gerarPessoas, Pessoa } from '../data';
import { formatarNumero } from '../format';

const ALTURA_LINHA = 53;
const ALTURA_AREA = 560;

const COLUNAS: ColumnDef<Pessoa>[] = [
  { ...colunasPessoa.id, size: 80 },
  colunasPessoa.nomeSimples,
  colunasPessoa.cpf,
  colunasPessoa.departamento,
  colunasPessoa.cidade,
  colunasPessoa.salario,
  colunasPessoa.situacao
];

interface CorpoVirtualProps<T> {
  table: TanTable<T>;
  areaRef: RefObject<HTMLDivElement | null>;
  carregando?: boolean;
  onScroll?: () => void;
}

/**
 * Tabela virtualizada: só as linhas visíveis (e algumas de folga) vão para o DOM.
 * Linhas espaçadoras no topo e no fim mantêm a altura total e a barra de rolagem corretas.
 */
function TabelaVirtual<T>({ table, areaRef, carregando, onScroll }: CorpoVirtualProps<T>) {
  const linhas = table.getRowModel().rows;
  const virtualizador = useVirtualizer({
    count: linhas.length,
    getScrollElement: () => areaRef.current,
    estimateSize: () => ALTURA_LINHA,
    overscan: 10
  });
  const itens = virtualizador.getVirtualItems();
  const topo = itens.length > 0 ? itens[0].start : 0;
  const fim = itens.length > 0 ? virtualizador.getTotalSize() - itens[itens.length - 1].end : 0;
  const colunas = table.getVisibleLeafColumns().length;

  return (
    <TableContainer ref={areaRef} onScroll={onScroll} sx={{ height: ALTURA_AREA, overflow: 'auto' }}>
      <Table
        sx={{
          tableLayout: 'fixed',
          minWidth: 900,
          '& td:first-of-type, & th:first-of-type': { pl: 2.5 },
          '& td': { height: ALTURA_LINHA, py: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
        }}
      >
        <TableHead sx={{ position: 'sticky', top: 0, zIndex: 2 }}>
          {table.getHeaderGroups().map((g) => (
            <TableRow key={g.id}>
              {g.headers.map((h) => (
                <TableCell key={h.id} align={colMeta(h.column).align} sx={{ width: h.getSize() }}>
                  <SortHeader header={h} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {topo > 0 && (
            <TableRow aria-hidden>
              <TableCell colSpan={colunas} sx={{ height: `${topo}px !important`, p: 0, border: 0 }} />
            </TableRow>
          )}
          {itens.map((item) => {
            const row = linhas[item.index];
            return (
              <TableRow key={row.id} hover data-index={item.index}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} align={colMeta(cell.column).align}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
          {fim > 0 && (
            <TableRow aria-hidden>
              <TableCell colSpan={colunas} sx={{ height: `${fim}px !important`, p: 0, border: 0 }} />
            </TableRow>
          )}
          {linhas.length === 0 && !carregando && (
            <TableRow>
              <TableCell colSpan={colunas} sx={{ height: 'auto !important', border: 0 }}>
                <TableEmpty title="Nada encontrado" description="Nenhuma linha atende à busca." />
              </TableCell>
            </TableRow>
          )}
          {carregando && (
            <TableRow>
              <TableCell colSpan={colunas}>
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    Carregando mais registros…
                  </Typography>
                </Stack>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function DezMil() {
  const [dados] = useState(() => gerarPessoas(10000, 99));
  const areaRef = useRef<HTMLDivElement>(null);
  const table = useDataTable({
    data: dados,
    columns: COLUNAS,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  });
  return (
    <Panel flush title="10 mil linhas" subtitle="Ordenação e busca sobre toda a base; só as linhas visíveis são renderizadas">
      <TableToolbar table={table} csv="dez-mil-linhas">
        <Typography variant="body2" color="text.secondary">
          {formatarNumero(table.getRowModel().rows.length)} linhas
        </Typography>
      </TableToolbar>
      <TabelaVirtual table={table} areaRef={areaRef} />
    </Panel>
  );
}

// "API" simulada: devolve páginas de uma base de 1.000 registros, já ordenada no "servidor"
const BASE_REMOTA = gerarPessoas(1000, 4242);
const TAMANHO_PAGINA = 50;

function buscarPagina(inicio: number, sorting: SortingState): Promise<Pessoa[]> {
  const ordenada = [...BASE_REMOTA];
  const [s] = sorting;
  if (s) {
    const chave = s.id as keyof Pessoa;
    ordenada.sort((a, b) => {
      const va = a[chave];
      const vb = b[chave];
      const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'pt-BR');
      return s.desc ? -r : r;
    });
  }
  return new Promise((resolve) => setTimeout(() => resolve(ordenada.slice(inicio, inicio + TAMANHO_PAGINA)), 600));
}

function RolagemInfinita() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dados, setDados] = useState<Pessoa[]>([]);
  const [carregando, setCarregando] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const pedido = useRef(0);
  const acabou = dados.length >= BASE_REMOTA.length;

  const carregar = useCallback(async (inicio: number, ordem: SortingState) => {
    const id = ++pedido.current;
    setCarregando(true);
    const pagina = await buscarPagina(inicio, ordem);
    // ignora respostas de pedidos antigos (ex.: a ordenação mudou no meio)
    if (id !== pedido.current) return;
    setDados((antes) => (inicio === 0 ? pagina : [...antes, ...pagina]));
    setCarregando(false);
  }, []);

  // nova ordenação: volta ao topo e recomeça do zero
  useEffect(() => {
    areaRef.current?.scrollTo({ top: 0 });
    void carregar(0, sorting);
  }, [sorting, carregar]);

  const table = useDataTable({
    data: dados,
    columns: COLUNAS,
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
    enableMultiSort: false
  });

  const aoRolar = () => {
    const el = areaRef.current;
    if (!el || carregando || acabou) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < ALTURA_LINHA * 6) void carregar(dados.length, sorting);
  };

  return (
    <Panel
      flush
      title="Rolagem infinita"
      subtitle="Novos registros chegam de uma API simulada ao se aproximar do fim; a ordenação é feita no “servidor”"
    >
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.5, minHeight: 64 }}>
        <Typography variant="body2" color="text.secondary">
          {formatarNumero(dados.length)} de {formatarNumero(BASE_REMOTA.length)} carregados
        </Typography>
        {acabou && (
          <Typography variant="body2" color="success.main">
            Todos os registros carregados
          </Typography>
        )}
      </Stack>
      <TabelaVirtual table={table} areaRef={areaRef} carregando={carregando} onScroll={aoRolar} />
    </Panel>
  );
}

export default function DadosVirtualizada() {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <DezMil />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <RolagemInfinita />
      </Grid>
    </Grid>
  );
}
