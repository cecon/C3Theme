import { useState } from 'react';

// material-ui
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

// third-party
import { ColumnDef, getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/react-table';

import { Panel } from '@c3theme/ui';
import { colunasPessoa, TablePagination, TableView, TableToolbar, useDataTable } from '../components';
import { Pessoa, PESSOAS } from '../data';

const COLUNAS: ColumnDef<Pessoa>[] = [
  colunasPessoa.id,
  colunasPessoa.nomeSimples,
  colunasPessoa.cpf,
  colunasPessoa.telefone,
  colunasPessoa.uf,
  colunasPessoa.cargo,
  colunasPessoa.admissao,
  colunasPessoa.salario
];

export default function DadosDensa() {
  const [densa, setDensa] = useState(true);
  const table = useDataTable({
    data: PESSOAS,
    columns: COLUNAS,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 25 } }
  });
  return (
    <Panel flush>
      <TableToolbar table={table} csv="tabela-densa">
        <FormControlLabel control={<Switch checked={densa} onChange={(e) => setDensa(e.target.checked)} />} label="Compacta" />
      </TableToolbar>
      <TableView table={table} dense={densa} striped minWidth={900} ariaLabel="Tabela densa" />
      <TablePagination table={table} />
    </Panel>
  );
}
