import { useState } from 'react';

// material-ui
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import {
  ColumnDef,
  ExpandedState,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  GroupingState
} from '@tanstack/react-table';
import { Category } from 'iconsax-reactjs';

import { Panel } from '@c3theme/ui';
import { colLabel, colunasPessoa, TablePagination, TableView, TableToolbar, useDataTable } from '../components';
import { Pessoa, PESSOAS } from '../data';

const COLUNAS: ColumnDef<Pessoa>[] = [
  colunasPessoa.departamento,
  colunasPessoa.situacao,
  colunasPessoa.uf,
  { ...colunasPessoa.nome, aggregatedCell: ({ row }) => `${row.getLeafRows().length} pessoas` },
  colunasPessoa.idade,
  colunasPessoa.salario,
  colunasPessoa.progresso
];

const AGRUPAVEIS = ['departamento', 'situacao', 'uf'];

export default function DadosAgrupamento() {
  const [grouping, setGrouping] = useState<GroupingState>(['departamento']);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const table = useDataTable({
    data: PESSOAS,
    columns: COLUNAS,
    state: { grouping, expanded },
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 25 } }
  });

  return (
    <Panel
      flush
      title="Agrupamento"
      subtitle="Escolha as colunas de agrupamento; idade (média), salário (soma) e meta (média) são agregados por grupo"
    >
      <TableToolbar
        table={table}
        csv="agrupamento"
        acoes={
          <Chip
            label={table.getIsAllRowsExpanded() ? 'Recolher todos' : 'Expandir todos'}
            onClick={() => table.toggleAllRowsExpanded()}
            variant="outlined"
          />
        }
      >
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            Agrupar por:
          </Typography>
          {AGRUPAVEIS.map((id) => {
            const coluna = table.getColumn(id);
            if (!coluna) return null;
            const ordem = grouping.indexOf(id);
            return (
              <Chip
                key={id}
                icon={<Category size={14} />}
                label={ordem >= 0 ? `${ordem + 1}. ${colLabel(coluna)}` : colLabel(coluna)}
                color={ordem >= 0 ? 'primary' : 'default'}
                variant={ordem >= 0 ? 'filled' : 'outlined'}
                onClick={coluna.getToggleGroupingHandler()}
                aria-pressed={ordem >= 0}
              />
            );
          })}
        </Stack>
      </TableToolbar>
      <TableView table={table} minWidth={1000} ariaLabel="Tabela agrupada" />
      <TablePagination table={table} />
    </Panel>
  );
}
