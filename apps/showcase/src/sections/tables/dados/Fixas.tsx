import { useState } from 'react';

// material-ui
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { ColumnDef, ColumnPinningState, getFilteredRowModel, getSortedRowModel } from '@tanstack/react-table';
import { Edit2 } from 'iconsax-reactjs';

import { notify, Panel, SoftIconButton } from '@c3theme/ui';
import { colLabel, colunasPessoa, TableView, meta, TableToolbar, useDataTable } from '../components';
import { Pessoa, PESSOAS } from '../data';

const COLUNAS: ColumnDef<Pessoa>[] = [
  colunasPessoa.id,
  { ...colunasPessoa.nome, size: 240 },
  colunasPessoa.email,
  colunasPessoa.cpf,
  colunasPessoa.telefone,
  colunasPessoa.departamento,
  colunasPessoa.cargo,
  colunasPessoa.cidade,
  colunasPessoa.idade,
  colunasPessoa.salario,
  colunasPessoa.situacao,
  colunasPessoa.admissao,
  {
    id: 'acoes',
    header: 'Ações',
    size: 80,
    meta: meta({ label: 'Ações', align: 'center' }),
    cell: ({ row }) => (
      <SoftIconButton size="small" aria-label={`Editar ${row.original.nome}`} onClick={() => notify(`Editar ${row.original.nome}`, 'info')}>
        <Edit2 size={16} />
      </SoftIconButton>
    )
  }
];

const ROTULO_LADO = { left: 'à esquerda', right: 'à direita' } as const;

export default function DadosFixas() {
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({ left: ['id', 'nome'], right: ['acoes'] });
  const table = useDataTable({
    data: PESSOAS,
    columns: COLUNAS,
    state: { columnPinning },
    onColumnPinningChange: setColumnPinning,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  return (
    <Panel
      flush
      title="Cabeçalho e colunas fixos"
      subtitle="Role na vertical e na horizontal: o cabeçalho, as colunas da esquerda e a de ações ficam no lugar"
    >
      <TableToolbar table={table} csv="colunas-fixas" />
      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center', px: 2.5, pb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
          Fixar (clique alterna: solta → esquerda → direita):
        </Typography>
        {table.getAllLeafColumns().map((c) => {
          const lado = c.getIsPinned();
          return (
            <Chip
              key={c.id}
              size="small"
              label={lado ? `${colLabel(c)} ${ROTULO_LADO[lado]}` : colLabel(c)}
              color={lado ? 'primary' : 'default'}
              variant={lado ? 'filled' : 'outlined'}
              onClick={() => c.pin(lado === false ? 'left' : lado === 'left' ? 'right' : false)}
            />
          );
        })}
      </Stack>
      <TableView table={table} stickyHeader maxHeight={480} fixedLayout ariaLabel="Tabela com cabeçalho e colunas fixos" />
      <Typography variant="caption" color="text.secondary" component="p" sx={{ px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
        {table.getRowModel().rows.length} linhas sem paginação, para testar a rolagem.
      </Typography>
    </Panel>
  );
}
