import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

// third-party
import {
  ColumnDef,
  ExpandedState,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table';

import { Panel, StatusChip } from '@c3theme/ui';
import {
  colunasPessoa,
  TablePagination,
  TableView,
  DetalhePessoa,
  ExpandButton,
  expandColumn,
  meta,
  PessoaCell,
  TableToolbar,
  useDataTable
} from '../components';
import { gerarOrganograma, Pedido, pedidosDe, Pessoa, PESSOAS, SituacaoPedido, TONS_PEDIDO } from '../data';
import { formatarData, formatarMoeda } from '../format';

// ---------- Sub-linhas (hierarquia) ----------

const COLUNAS_ARVORE: ColumnDef<Pessoa>[] = [
  {
    ...colunasPessoa.nome,
    header: 'Pessoa',
    cell: ({ row }) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: row.depth * 3.5 }}>
        {row.getCanExpand() ? (
          <ExpandButton
            open={row.getIsExpanded()}
            onClick={row.getToggleExpandedHandler()}
            label={row.getIsExpanded() ? 'Recolher equipe' : 'Ver equipe'}
          />
        ) : (
          <Box sx={{ width: 30 }} />
        )}
        <PessoaCell id={row.original.id} nome={row.original.nome} email={row.original.cargo} />
        {row.subRows.length > 0 && (
          <Typography variant="caption" color="text.secondary" noWrap>
            ({row.subRows.length} na equipe)
          </Typography>
        )}
      </Box>
    )
  },
  colunasPessoa.departamento,
  colunasPessoa.cidade,
  colunasPessoa.salario,
  colunasPessoa.situacao
];

function Hierarquia() {
  const [dados] = useState(gerarOrganograma);
  const [expanded, setExpanded] = useState<ExpandedState>({ '0': true });
  const table = useDataTable({
    data: dados,
    columns: COLUNAS_ARVORE,
    state: { expanded },
    onExpandedChange: setExpanded,
    getSubRows: (p) => p.equipe,
    // a busca acha pessoas em qualquer nível e mantém os gestores acima delas
    filterFromLeafRows: true,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel()
  });
  return (
    <Panel flush title="Sub-linhas" subtitle="Gestores com suas equipes, em até três níveis">
      <TableToolbar
        table={table}
        csv="organograma"
        placeholder="Buscar em todos os níveis…"
        acoes={
          <Button color="secondary" onClick={() => table.toggleAllRowsExpanded()}>
            {table.getIsAllRowsExpanded() ? 'Recolher tudo' : 'Expandir tudo'}
          </Button>
        }
      />
      <TableView table={table} minWidth={960} ariaLabel="Tabela hierárquica" />
    </Panel>
  );
}

// ---------- Painel de detalhe ----------

const COLUNAS_DETALHE: ColumnDef<Pessoa>[] = [
  expandColumn<Pessoa>(),
  colunasPessoa.nome,
  colunasPessoa.departamento,
  colunasPessoa.cargo,
  colunasPessoa.situacao
];

function Detalhe() {
  const table = useDataTable({
    data: PESSOAS.slice(0, 40),
    columns: COLUNAS_DETALHE,
    getRowCanExpand: () => true,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { expanded: { '0': true }, pagination: { pageIndex: 0, pageSize: 5 } }
  });
  return (
    <Panel flush title="Painel de detalhe" subtitle="Clique na linha ou na seta para ver os dados completos">
      <TableToolbar table={table} csv="detalhe" />
      <TableView
        table={table}
        minWidth={760}
        ariaLabel="Tabela com painel de detalhe"
        onRowClick={(row) => row.toggleExpanded()}
        renderDetail={(row) => <DetalhePessoa pessoa={row.original} />}
      />
      <TablePagination table={table} pageSizes={[5, 10, 20]} jumpTo={false} />
    </Panel>
  );
}

// ---------- Subtabela ----------

const COLUNAS_PEDIDO: ColumnDef<Pedido>[] = [
  { accessorKey: 'numero', header: 'Pedido', meta: meta({ label: 'Pedido' }) },
  { accessorKey: 'data', header: 'Data', meta: meta({ label: 'Data' }), cell: ({ getValue }) => formatarData(getValue<string>()) },
  { accessorKey: 'produto', header: 'Produto', meta: meta({ label: 'Produto' }) },
  { accessorKey: 'quantidade', header: 'Qtd.', meta: meta({ label: 'Quantidade', align: 'right' }) },
  {
    id: 'total',
    accessorFn: (p) => p.quantidade * p.valorUnitario,
    header: 'Total',
    meta: meta({ label: 'Total', align: 'right' }),
    cell: ({ getValue }) => formatarMoeda(getValue<number>())
  },
  {
    accessorKey: 'situacao',
    header: 'Situação',
    meta: meta({ label: 'Situação' }),
    cell: ({ getValue }) => <StatusChip label={getValue<SituacaoPedido>()} tone={TONS_PEDIDO[getValue<SituacaoPedido>()]} />
  }
];

function SubtabelaPedidos({ pessoa }: { pessoa: Pessoa }) {
  const [dados] = useState(() => pedidosDe(pessoa.id));
  const table = useDataTable({
    data: dados,
    columns: COLUNAS_PEDIDO,
    getSortedRowModel: getSortedRowModel()
  });
  return (
    <Box sx={{ py: 2, px: { xs: 1, sm: 7 }, bgcolor: 'background.default' }}>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>
        <TableView table={table} dense minWidth={620} ariaLabel={`Pedidos de ${pessoa.nome}`} />
      </Box>
    </Box>
  );
}

const COLUNAS_CLIENTE: ColumnDef<Pessoa>[] = [
  expandColumn<Pessoa>(),
  colunasPessoa.nome,
  colunasPessoa.cidade,
  {
    id: 'pedidos',
    header: 'Pedidos',
    accessorFn: (p) => pedidosDe(p.id).length,
    meta: meta({ label: 'Pedidos', align: 'right' })
  },
  {
    id: 'comprado',
    header: 'Total comprado',
    accessorFn: (p) =>
      pedidosDe(p.id)
        .filter((x) => x.situacao !== 'Cancelado')
        .reduce((acc, x) => acc + x.quantidade * x.valorUnitario, 0),
    meta: meta({ label: 'Total comprado', align: 'right' }),
    cell: ({ getValue }) => formatarMoeda(getValue<number>())
  }
];

function Subtabela() {
  const table = useDataTable({
    data: PESSOAS.slice(40, 70),
    columns: COLUNAS_CLIENTE,
    getRowCanExpand: () => true,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } }
  });
  return (
    <Panel flush title="Subtabela" subtitle="Cada cliente abre uma tabela própria de pedidos, ordenável">
      <TableToolbar table={table} csv="clientes" />
      <TableView
        table={table}
        minWidth={720}
        ariaLabel="Clientes com subtabela de pedidos"
        renderDetail={(row) => <SubtabelaPedidos pessoa={row.original} />}
      />
      <TablePagination table={table} pageSizes={[5, 10, 20]} jumpTo={false} />
    </Panel>
  );
}

export default function DadosExpansivel() {
  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Hierarquia />
      </Grid>
      <Grid size={12}>
        <Detalhe />
      </Grid>
      <Grid size={12}>
        <Subtabela />
      </Grid>
    </Grid>
  );
}
