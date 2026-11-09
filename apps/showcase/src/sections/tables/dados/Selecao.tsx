import { useMemo, useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import {
  ColumnDef,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  RowSelectionState
} from '@tanstack/react-table';
import { Refresh2, Trash } from 'iconsax-reactjs';

import { notify, Panel } from '@c3theme/ui';
import {
  colunasPessoa,
  ConfirmDialog,
  TablePagination,
  TableView,
  PessoaCell,
  selectColumn,
  TableToolbar,
  useDataTable
} from '../components';
import { Pessoa, PESSOAS, Situacao, SITUACOES } from '../data';
import { formatarMoeda } from '../format';

const COLUNAS: ColumnDef<Pessoa>[] = [
  selectColumn<Pessoa>(),
  colunasPessoa.nome,
  colunasPessoa.departamento,
  colunasPessoa.cargo,
  colunasPessoa.salario,
  colunasPessoa.situacao
];

function MudarSituacao({ onEscolher }: { onEscolher: (s: Situacao) => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button variant="outlined" color="inherit" startIcon={<Refresh2 size={16} />} onClick={(e) => setAnchor(e.currentTarget)}>
        Mudar situação
      </Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {SITUACOES.map((s) => (
          <MenuItem
            key={s}
            onClick={() => {
              onEscolher(s);
              setAnchor(null);
            }}
          >
            {s}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default function DadosSelecao() {
  const [dados, setDados] = useState(() => PESSOAS.slice(0, 60));
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [excluir, setExcluir] = useState<Row<Pessoa>[] | null>(null);

  const table = useDataTable({
    data: dados,
    columns: COLUNAS,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getRowId: (p) => String(p.id),
    // pessoas desligadas não podem ser selecionadas
    enableRowSelection: (row) => row.original.situacao !== 'Desligado',
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues()
  });

  const selecionadas = useMemo(() => dados.filter((p) => rowSelection[String(p.id)]), [dados, rowSelection]);
  const folha = selecionadas.reduce((acc, p) => acc + p.salario, 0);

  const mudarSituacao = (linhas: Row<Pessoa>[], situacao: Situacao) => {
    const ids = new Set(linhas.map((r) => r.original.id));
    setDados((antes) => antes.map((p) => (ids.has(p.id) ? { ...p, situacao } : p)));
    if (situacao === 'Desligado') setRowSelection({});
    notify(`Situação de ${ids.size} pessoa(s) alterada para ${situacao}.`, 'success');
  };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Panel flush>
          <TableToolbar
            table={table}
            csv="selecao"
            acoesEmLote={(linhas) => (
              <>
                <MudarSituacao onEscolher={(s) => mudarSituacao(linhas, s)} />
                <Button variant="contained" color="error" startIcon={<Trash size={16} />} onClick={() => setExcluir(linhas)}>
                  Excluir
                </Button>
              </>
            )}
          >
            <Typography variant="body2" color="text.secondary">
              Pessoas desligadas não podem ser selecionadas.
            </Typography>
          </TableToolbar>
          <TableView
            table={table}
            minWidth={820}
            ariaLabel="Tabela com seleção de linhas"
            onRowClick={(row) => row.getCanSelect() && row.toggleSelected()}
          />
          <TablePagination table={table} jumpTo={false} />
        </Panel>
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <Panel title="Selecionadas" subtitle={`${selecionadas.length} de ${dados.length} · folha ${formatarMoeda(folha)}`}>
          {selecionadas.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Marque linhas na tabela (ou clique nelas) para vê-las aqui. A seleção é mantida ao trocar de página, ordenar ou filtrar.
            </Typography>
          ) : (
            <Stack spacing={1.5} sx={{ maxHeight: 520, overflow: 'auto' }}>
              {selecionadas.map((p) => (
                <PessoaCell key={p.id} id={p.id} nome={p.nome} email={p.cargo} />
              ))}
            </Stack>
          )}
        </Panel>
      </Grid>
      <ConfirmDialog
        open={!!excluir}
        titulo="Excluir selecionadas"
        onClose={() => setExcluir(null)}
        onConfirm={() => {
          if (!excluir) return;
          const ids = new Set(excluir.map((r) => r.original.id));
          setDados((antes) => antes.filter((p) => !ids.has(p.id)));
          setRowSelection({});
          notify(`${ids.size} pessoa(s) excluída(s).`, 'success');
        }}
      >
        Excluir {excluir?.length} pessoa(s) da lista? Esta ação não pode ser desfeita.
      </ConfirmDialog>
    </Grid>
  );
}
