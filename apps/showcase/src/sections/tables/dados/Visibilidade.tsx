import { useState } from 'react';

// material-ui
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { ColumnDef, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, VisibilityState } from '@tanstack/react-table';
import { Eye, EyeSlash } from 'iconsax-reactjs';

import { Panel } from '@c3theme/ui';
import { colLabel, colunasPessoa, TablePagination, TableView, TableToolbar, useDataTable } from '../components';
import { Pessoa, PESSOAS } from '../data';

const COLUNAS: ColumnDef<Pessoa>[] = [
  { ...colunasPessoa.nome, enableHiding: false },
  colunasPessoa.email,
  colunasPessoa.cpf,
  colunasPessoa.telefone,
  colunasPessoa.departamento,
  colunasPessoa.cargo,
  colunasPessoa.cidade,
  colunasPessoa.idade,
  colunasPessoa.salario,
  colunasPessoa.situacao,
  colunasPessoa.admissao
];

export default function DadosVisibilidade() {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ email: false, cpf: false, telefone: false, idade: false });
  const table = useDataTable({
    data: PESSOAS,
    columns: COLUNAS,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <Panel
      flush
      title="Mostrar e ocultar colunas"
      subtitle="Use o menu “Colunas” ou os atalhos abaixo; o nome não pode ser ocultado. O CSV exporta só as colunas visíveis."
    >
      <TableToolbar table={table} colunas csv="colunas-visiveis" />
      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center', px: 2.5, pb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
          Atalhos:
        </Typography>
        {table
          .getAllLeafColumns()
          .filter((c) => c.getCanHide())
          .map((c) => (
            <Chip
              key={c.id}
              size="small"
              icon={c.getIsVisible() ? <Eye size={14} /> : <EyeSlash size={14} />}
              label={colLabel(c)}
              color={c.getIsVisible() ? 'primary' : 'default'}
              variant={c.getIsVisible() ? 'filled' : 'outlined'}
              onClick={c.getToggleVisibilityHandler()}
              aria-pressed={c.getIsVisible()}
            />
          ))}
      </Stack>
      <TableView table={table} minWidth={720} ariaLabel="Tabela com colunas configuráveis" />
      <TablePagination table={table} />
    </Panel>
  );
}
