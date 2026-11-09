import { useState } from 'react';

// material-ui
import Button from '@mui/material/Button';

// third-party
import {
  ColumnDef,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  RowSelectionState
} from '@tanstack/react-table';
import { Filter, Trash } from 'iconsax-reactjs';

import { notify, Panel } from '@c3theme/ui';
import {
  colunasPessoa,
  ConfirmDialog,
  TablePagination,
  TableView,
  DetalhePessoa,
  expandColumn,
  meta,
  selectColumn,
  TableToolbar,
  useDataTable
} from '../components';
import { Pessoa, PESSOAS } from '../data';

// Cabeçalho "guarda-chuva": grupos de colunas sob um título comum
const COLUNAS: ColumnDef<Pessoa>[] = [
  {
    id: 'controle',
    header: '',
    columns: [selectColumn<Pessoa>(), expandColumn<Pessoa>()]
  },
  {
    id: 'colaborador',
    header: 'Colaborador',
    meta: meta({ label: 'Colaborador' }),
    columns: [colunasPessoa.nome, colunasPessoa.cpf]
  },
  {
    id: 'lotacao',
    header: 'Lotação',
    meta: meta({ label: 'Lotação' }),
    columns: [colunasPessoa.departamento, colunasPessoa.cargo, colunasPessoa.uf]
  },
  {
    id: 'desempenho',
    header: 'Remuneração e desempenho',
    meta: meta({ label: 'Remuneração e desempenho' }),
    columns: [colunasPessoa.salario, colunasPessoa.progresso, colunasPessoa.situacao]
  }
];

export default function DadosGuardaChuva() {
  const [dados, setDados] = useState(() => PESSOAS);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [filtros, setFiltros] = useState(false);
  const [excluir, setExcluir] = useState<Row<Pessoa>[] | null>(null);

  const table = useDataTable({
    data: dados,
    columns: COLUNAS,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getRowId: (p) => String(p.id),
    getRowCanExpand: () => true,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  });

  return (
    <Panel flush>
      <TableToolbar
        table={table}
        colunas
        csv="guarda-chuva"
        acoes={
          <Button
            variant={filtros ? 'contained' : 'outlined'}
            color={filtros ? 'primary' : 'secondary'}
            startIcon={<Filter size={18} />}
            onClick={() => {
              if (filtros) table.resetColumnFilters();
              setFiltros((v) => !v);
            }}
          >
            Filtros
          </Button>
        }
        acoesEmLote={(linhas) => (
          <Button variant="contained" color="error" startIcon={<Trash size={16} />} onClick={() => setExcluir(linhas)}>
            Excluir
          </Button>
        )}
      />
      <TableView
        table={table}
        bordered
        showFilters={filtros}
        minWidth={1180}
        renderDetail={(row) => <DetalhePessoa pessoa={row.original} />}
        ariaLabel="Tabela com cabeçalho agrupado"
      />
      <TablePagination table={table} />
      <ConfirmDialog
        open={!!excluir}
        titulo="Excluir selecionadas"
        onClose={() => setExcluir(null)}
        onConfirm={() => {
          if (!excluir) return;
          const ids = new Set(excluir.map((r) => r.original.id));
          setDados((antes) => antes.filter((p) => !ids.has(p.id)));
          setRowSelection({});
          notify(`${ids.size} registro(s) excluído(s).`, 'success');
        }}
      >
        Excluir {excluir?.length} registro(s)? Esta ação não pode ser desfeita.
      </ConfirmDialog>
    </Panel>
  );
}
