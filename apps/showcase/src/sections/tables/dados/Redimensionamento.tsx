import { useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

// third-party
import { ColumnDef, ColumnResizeMode, getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/react-table';
import { Refresh2 } from 'iconsax-reactjs';

import { Panel } from '@c3theme/ui';
import { colunasPessoa, TablePagination, TableView, TableToolbar, useDataTable } from '../components';
import { Pessoa, PESSOAS } from '../data';

const COLUNAS: ColumnDef<Pessoa>[] = [
  colunasPessoa.nomeSimples,
  colunasPessoa.email,
  colunasPessoa.departamento,
  colunasPessoa.cargo,
  colunasPessoa.cidade,
  colunasPessoa.salario,
  colunasPessoa.situacao
];

export default function DadosRedimensionamento() {
  const [modo, setModo] = useState<ColumnResizeMode>('onChange');
  const table = useDataTable({
    data: PESSOAS,
    columns: COLUNAS,
    columnResizeMode: modo,
    enableColumnResizing: true,
    defaultColumn: { minSize: 70, maxSize: 480 },
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  const larguras = table.getState().columnSizing;
  const alteradas = Object.keys(larguras).length;

  return (
    <Panel flush title="Redimensionar colunas" subtitle="Arraste a borda direita de um título; duplo clique volta ao tamanho original">
      <TableToolbar
        table={table}
        csv="colunas-redimensionadas"
        acoes={
          <Button color="secondary" startIcon={<Refresh2 size={16} />} disabled={alteradas === 0} onClick={() => table.resetColumnSizing()}>
            Larguras originais
          </Button>
        }
      >
        <ToggleButtonGroup
          size="small"
          exclusive
          value={modo}
          onChange={(_, v: ColumnResizeMode | null) => v && setModo(v)}
          aria-label="Modo de redimensionamento"
        >
          <ToggleButton value="onChange">Ao arrastar</ToggleButton>
          <ToggleButton value="onEnd">Ao soltar</ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary">
          Largura total: {table.getTotalSize()} px
        </Typography>
      </TableToolbar>
      <TableView table={table} fixedLayout ariaLabel="Tabela com colunas redimensionáveis" />
      <TablePagination table={table} />
    </Panel>
  );
}
