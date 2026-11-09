import { useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';

// third-party
import { ColumnDef, getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/react-table';
import { Add, SearchNormal1 } from 'iconsax-reactjs';

import { notify, Panel } from '@c3theme/ui';
import { COLUNAS_PADRAO, TablePagination, TableView, TableEmpty, TableToolbar, useDataTable } from '../components';
import { Pessoa, PESSOAS } from '../data';

const COLUNAS: ColumnDef<Pessoa>[] = COLUNAS_PADRAO.slice(0, 6);

function SemDados() {
  const [dados, setDados] = useState<Pessoa[]>([]);
  const table = useDataTable({
    data: dados,
    columns: COLUNAS,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } }
  });
  return (
    <Panel
      flush
      title="Sem registros"
      subtitle="A tabela ainda não tem dados"
      action={
        dados.length > 0 && (
          <Button size="small" color="error" onClick={() => setDados([])}>
            Esvaziar
          </Button>
        )
      }
    >
      <TableView
        table={table}
        minWidth={760}
        ariaLabel="Tabela sem registros"
        empty={
          <TableEmpty
            title="Nenhum colaborador cadastrado"
            description="Quando houver cadastros, eles aparecem aqui com busca, ordenação e paginação."
            action={
              <Button
                variant="contained"
                startIcon={<Add size={18} />}
                onClick={() => {
                  setDados(PESSOAS.slice(0, 12));
                  notify('12 registros de exemplo carregados.', 'success');
                }}
              >
                Carregar exemplos
              </Button>
            }
          />
        }
      />
      {dados.length > 0 && <TablePagination table={table} jumpTo={false} />}
    </Panel>
  );
}

function SemResultados() {
  const table = useDataTable({
    data: PESSOAS,
    columns: COLUNAS,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { globalFilter: 'Zacarias', pagination: { pageIndex: 0, pageSize: 5 } }
  });
  return (
    <Panel flush title="Busca sem resultado" subtitle="Há dados, mas nenhum atende à busca">
      <TableToolbar table={table} />
      <TableView
        table={table}
        minWidth={760}
        ariaLabel="Tabela com busca sem resultado"
        empty={
          <TableEmpty
            icon={<SearchNormal1 size={28} />}
            title={`Nada encontrado para “${String(table.getState().globalFilter)}”`}
            description="Confira a grafia ou limpe a busca para ver todos os registros."
            action={
              <Button variant="outlined" onClick={() => table.setGlobalFilter('')}>
                Limpar busca
              </Button>
            }
          />
        }
      />
      <TablePagination table={table} jumpTo={false} />
    </Panel>
  );
}

export default function DadosVazia() {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, xl: 6 }}>
        <SemDados />
      </Grid>
      <Grid size={{ xs: 12, xl: 6 }}>
        <SemResultados />
      </Grid>
    </Grid>
  );
}
