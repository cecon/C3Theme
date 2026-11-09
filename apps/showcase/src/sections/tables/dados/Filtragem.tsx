// material-ui
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

// third-party
import {
  ColumnDef,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table';
import { FilterRemove } from 'iconsax-reactjs';

import { Panel } from '@c3theme/ui';
import { colunasPessoa, TablePagination, TableView, TableEmpty, TableToolbar, useDataTable } from '../components';
import { Pessoa, PESSOAS } from '../data';

const COLUNAS: ColumnDef<Pessoa>[] = [
  { ...colunasPessoa.nome, size: 220 },
  colunasPessoa.departamento,
  colunasPessoa.cidade,
  colunasPessoa.uf,
  colunasPessoa.idade,
  colunasPessoa.salario,
  colunasPessoa.situacao
];

export default function DadosFiltragem() {
  const table = useDataTable({
    data: PESSOAS,
    columns: COLUNAS,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  });
  const { columnFilters, globalFilter } = table.getState();
  const ativos = columnFilters.length + (globalFilter ? 1 : 0);
  const limpar = () => {
    table.resetColumnFilters();
    table.setGlobalFilter('');
  };

  return (
    <Panel flush title="Filtros" subtitle="Busca geral (sem acento) e filtro por coluna: texto, faixa numérica e lista">
      <TableToolbar table={table} csv="filtragem" colunas>
        <Typography variant="body2" color="text.secondary">
          {table.getFilteredRowModel().rows.length} de {PESSOAS.length} registros
        </Typography>
        {ativos > 0 && (
          <Button size="small" color="error" startIcon={<FilterRemove size={16} />} onClick={limpar}>
            Limpar filtros ({ativos})
          </Button>
        )}
      </TableToolbar>
      <TableView
        table={table}
        showFilters
        minWidth={1000}
        ariaLabel="Tabela com filtros"
        empty={
          <TableEmpty
            title="Nenhum registro com esses filtros"
            description="Remova algum filtro para ampliar o resultado."
            action={
              <Button variant="outlined" onClick={limpar}>
                Limpar filtros
              </Button>
            }
          />
        }
      />
      <TablePagination table={table} />
    </Panel>
  );
}
