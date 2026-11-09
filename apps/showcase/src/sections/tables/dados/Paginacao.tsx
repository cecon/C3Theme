// material-ui
import Grid from '@mui/material/Grid';

// third-party
import { ColumnDef, getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/react-table';

import { Panel } from '@c3theme/ui';
import { colunasPessoa, TablePagination, TableView, TableToolbar, useDataTable } from '../components';
import { Pessoa, PESSOAS } from '../data';

const COLUNAS: ColumnDef<Pessoa>[] = [
  colunasPessoa.id,
  colunasPessoa.nome,
  colunasPessoa.departamento,
  colunasPessoa.cidade,
  colunasPessoa.salario,
  colunasPessoa.situacao
];

function Exemplo({ topo }: { topo?: boolean }) {
  const table = useDataTable({
    data: PESSOAS,
    columns: COLUNAS,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: topo ? 5 : 10 } }
  });
  const titulo = topo ? 'Paginação no topo' : 'Paginação no rodapé';
  return (
    <Panel flush title={titulo} subtitle="Linhas por página, páginas numeradas e campo para ir direto a uma página">
      <TableToolbar table={table} csv={topo ? 'paginacao-topo' : 'paginacao-rodape'} />
      {topo && <TablePagination table={table} position="top" pageSizes={[5, 10, 20]} />}
      <TableView table={table} minWidth={820} ariaLabel={titulo} />
      {!topo && <TablePagination table={table} />}
    </Panel>
  );
}

export default function DadosPaginacao() {
  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Exemplo topo />
      </Grid>
      <Grid size={12}>
        <Exemplo />
      </Grid>
    </Grid>
  );
}
