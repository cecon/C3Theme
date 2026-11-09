import { useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { ColumnDef, getPaginationRowModel, getSortedRowModel, SortingState } from '@tanstack/react-table';

import { Panel } from '@c3theme/ui';
import { colLabel, colunasPessoa, TablePagination, TableView, TableToolbar, useDataTable } from '../components';
import { Pessoa, PESSOAS } from '../data';

const COLUNAS: ColumnDef<Pessoa>[] = [
  colunasPessoa.nome,
  colunasPessoa.departamento,
  colunasPessoa.idade,
  colunasPessoa.salario,
  colunasPessoa.situacao,
  colunasPessoa.admissao,
  { ...colunasPessoa.cpf, enableSorting: false }
];

export default function DadosOrdenacao() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'departamento', desc: false },
    { id: 'salario', desc: true }
  ]);
  const table = useDataTable({
    data: PESSOAS,
    columns: COLUNAS,
    state: { sorting },
    onSortingChange: setSorting,
    enableMultiSort: true,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <Panel flush title="Ordenação" subtitle="Clique no título para ordenar; Shift + clique soma colunas à ordenação (o CPF não ordena)">
      <TableToolbar table={table} busca={false} csv="ordenacao">
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            Ordem atual:
          </Typography>
          {sorting.length === 0 && <Chip size="small" label="original" />}
          {sorting.map((s, i) => {
            const coluna = table.getColumn(s.id);
            return (
              <Chip
                key={s.id}
                size="small"
                color="primary"
                variant="outlined"
                label={`${i + 1}. ${coluna ? colLabel(coluna) : s.id} ${s.desc ? '↓' : '↑'}`}
                onDelete={() => setSorting((antes) => antes.filter((x) => x.id !== s.id))}
              />
            );
          })}
          {sorting.length > 0 && (
            <Button size="small" onClick={() => setSorting([])}>
              Limpar
            </Button>
          )}
        </Stack>
      </TableToolbar>
      <TableView table={table} minWidth={900} ariaLabel="Tabela ordenável" />
      <TablePagination table={table} />
    </Panel>
  );
}
