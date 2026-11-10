import { useEffect, useState } from 'react';
import useSWR from 'swr';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';

// third-party
import { DocumentDownload, Trash } from 'iconsax-reactjs';

import { PageLoader, Panel } from '@c3theme/ui';
import { branchLabel, useEngine, useText } from '../context';
import { findOption } from '../format';
import { rowStyler } from '../rowStyle';
import AddButton from '../widgets/AddButton';
import ListActions from '../widgets/ListActions';
import type { FieldDef, WireRecord } from '../types';
import EntityDialog from './EntityDialog';
import { listColumns, recordTitle, withSourceColumns } from './list/listColumns';
import ListTable, { OwnerColumn } from './list/ListTable';
import { actionButtons, allowedRowActions } from './list/RowActionsCell';
import GalleryGrid from './gallery/GalleryGrid';
import { useRowDelete } from './list/useRowDelete';
import BulkBar from './list/BulkBar';
import EditBar from './list/EditBar';
import useInlineEdit from './list/useInlineEdit';
import ListToolbar from './list/ListToolbar';
import PresetTabs from './list/PresetTabs';
import ParamsBar from './list/ParamsBar';
import { useExportCsv } from './list/useExportCsv';
import { useListQuery } from './list/useListQuery';
import { refreshMs, useListTotals } from './list/useListTotals';
import { useListOpening } from './list/useListOpening';
import { summaryFields } from './list/selectionSum';
import { ViewSwitcher } from './views/ViewBar';
import { useLive } from '../live/useLive';

const PAGE_SIZES = [10, 25, 50, 100];

/** Lista da entidade. O estado (página, ordem, busca, preset, filtros) mora na URL: voltar e compartilhar funcionam. */
export default function EntityList({ entity, view = 'list' }: { entity: string; view?: 'list' | 'gallery' }) {
  const { client, entities, org } = useEngine();
  const { def, capabilities } = entities[entity];
  useLive(def);
  // entidade com escopo: a lista pode mostrar várias filiais (só leitura); grava-se na ativa
  const scoped = org && def.scope && def.scope !== 'group' ? org : undefined;
  const text = useText();
  const list = def.views?.list ?? {};
  const query = useListQuery(def, scoped);
  const { set, presetId, page, pageSize, sort, q, where, branchesParam, shownBranches, sourceParams } = query;

  const key = ['c3-list', entity, page, pageSize, sort, q, JSON.stringify(where), branchesParam, JSON.stringify(sourceParams), org?.active];
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () =>
      client.list(entity, {
        page,
        pageSize,
        sort: sort || undefined,
        q: q || undefined,
        where,
        branches: branchesParam ? shownBranches : undefined,
        params: sourceParams
      }),
    // fila que muda sozinha (refreshSeconds): o SWR relê só com a aba visível e mantém a página na tela
    { keepPreviousData: true, refreshInterval: refreshMs(list.refreshSeconds) }
  );

  // seleção para ação em lote: só da página na tela; trocar página, filtro ou filial limpa
  const bulkActions = (def.actions ?? []).filter((a) => a.bulk && capabilities.actions?.[a.name]);
  const bulkable = bulkActions.length > 0;
  // ícones na linha; com 'delete', a marcação de linhas também serve para excluir várias
  const rowActionNames = list.rowActions ?? [];
  const deletable = allowedRowActions(rowActionNames, capabilities).includes('delete');
  // somas da seleção (`summary` das ações em lote), sobre as linhas marcadas na tela
  const sums = summaryFields(bulkActions);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const listKey = JSON.stringify(key);
  useEffect(() => setSelected(new Set()), [listKey]);
  const pageRows = data?.data ?? [];
  // as linhas vêm sempre da página relida: depois de uma ação, a barra já vê a situação nova
  const selectedRows = pageRows.filter((r) => selected.has(r.id!));
  const allOnPage = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id!));
  const toggleRow = (row: WireRecord) =>
    setSelected((s) => {
      const next = new Set(s);
      if (!next.delete(row.id!)) next.add(row.id!);
      return next;
    });
  const togglePage = () => setSelected(allOnPage ? new Set() : new Set(pageRows.map((r) => r.id!)));
  const titleOf = recordTitle(def);
  const { askDelete, dialog: deleteDialog } = useRowDelete(entity, titleOf, (ids) =>
    setSelected((s) => new Set([...s].filter((id) => !ids.includes(id))))
  );
  // formulário sobre a lista: editar pela linha e, com `open: 'dialog'`, ver e criar
  const [dialog, setDialog] = useState<{ id?: string; edit?: boolean } | null>(null);
  const inDialog = list.open === 'dialog';

  // consulta do sistema pode escolher as colunas pelos parâmetros (o mês do período no cabeçalho)
  const columns = withSourceColumns(def, listColumns(def), data?.meta.columns);
  const inlineEdit = useInlineEdit(entity, def, () => void mutate());
  // com mais de uma filial (ou empresa) na tela, a dona de cada linha vira coluna
  const showOwner =
    scoped &&
    (def.scope === 'branch'
      ? shownBranches.length > 1
      : new Set(shownBranches.map((b) => scoped.context.branches.find((x) => x.id === b)?.company)).size > 1);
  const owner: OwnerColumn | undefined = showOwner
    ? def.scope === 'branch'
      ? { key: '_branch', label: 'Filial' }
      : { key: '_company', label: 'Empresa' }
    : undefined;
  const [sortField, sortDir] = sort.startsWith('-') ? [sort.slice(1).split(',')[0], 'desc' as const] : [sort.split(',')[0], 'asc' as const];

  const optionLabel = (f: FieldDef) => (v: string) => text(findOption(f, v)?.label, v);
  // o arquivo sai com as mesmas colunas da tela, inclusive a da filial dona
  const exportFields: FieldDef[] = [
    ...(owner ? [{ name: owner.key, type: 'reference' as const, label: owner.label }] : []),
    ...columns.map((c) => c.def)
  ];
  const totals = useListTotals(
    entity,
    columns.map((c) => c.field),
    query
  );
  const openingValue = useListOpening(entity, list.opening, query);
  const opening = openingValue && {
    field: list.opening!.field,
    value: openingValue.value,
    label: text(list.opening!.label ?? 'Saldo anterior')
  };
  const { exporting, exportCsv } = useExportCsv(entity, query, exportFields, optionLabel, totals, opening);

  return (
    <Panel flush>
      {def.source && <ParamsBar def={def} query={query} error={error} />}
      {list.presetTabs && <PresetTabs entity={entity} def={def} query={query} />}
      <ListToolbar
        def={def}
        query={query}
        scoped={scoped}
        total={data?.meta.total}
        actions={
          <>
            {/* com ações em lote, o Excluir vai para a barra da seleção */}
            {deletable && !bulkable && selectedRows.length > 0 && (
              <Button color="error" variant="outlined" startIcon={<Trash size={18} />} onClick={() => askDelete(selectedRows)}>
                Excluir ({selectedRows.length})
              </Button>
            )}
            {list.export !== false && (
              <Button
                color="secondary"
                variant="outlined"
                startIcon={<DocumentDownload size={18} />}
                onClick={exportCsv}
                loading={exporting}
                disabled={!data || data.meta.total === 0}
              >
                Exportar CSV
              </Button>
            )}
            <ViewSwitcher def={def} current={view} preset={presetId} />
            <ListActions entity={entity} />
            <AddButton
              entity={entity}
              preset={presetId}
              branch={scoped && branchLabel(scoped, scoped.active).branch}
              onClick={inDialog ? () => setDialog({}) : undefined}
            />
          </>
        }
      />

      {bulkable && selected.size > 0 && (
        <BulkBar
          entity={entity}
          def={def}
          rows={selectedRows}
          sums={sums}
          // ficam marcadas as que falharam e ainda estão na tela (na fila, a que mudou de situação já saiu)
          onBulkDone={(failed) => setSelected(new Set(failed.filter((id) => pageRows.some((r) => r.id === id))))}
          onDelete={deletable ? () => askDelete(selectedRows) : undefined}
        />
      )}

      <EditBar edit={inlineEdit} />

      {error && (
        <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
          {error.message}
        </Alert>
      )}

      {/* troca de página ou filtro: a página anterior fica na tela e a barra do topo avisa que a nova vem aí */}
      {isLoading && data && <PageLoader />}
      {view === 'gallery' ? (
        <GalleryGrid
          entity={entity}
          rows={data?.data}
          skeletonCards={Math.min(pageSize, 10)}
          selection={bulkable || deletable ? { selected, toggleRow } : undefined}
          actions={actionButtons(allowedRowActions(rowActionNames, capabilities))}
          onOpen={inDialog ? (row) => setDialog({ id: row.id! }) : undefined}
        />
      ) : (
        <ListTable
          entity={entity}
          columns={columns}
          rows={data?.data}
          loading={isLoading}
          skeletonRows={Math.min(pageSize, 10)}
          owner={owner}
          sort={{ field: sortField, dir: sortDir }}
          onSort={(field) => set({ sort: sortField === field && sortDir === 'asc' ? `-${field}` : field }, false)}
          selection={bulkable || deletable ? { selected, allOnPage, togglePage, toggleRow } : undefined}
          totals={totals}
          expand={list.expand}
          rowActions={
            rowActionNames.length > 0
              ? {
                  actions: (row) => allowedRowActions(rowActionNames, capabilities, row),
                  titleOf,
                  onView: inDialog ? (row) => setDialog({ id: row.id! }) : undefined,
                  onEdit: (row) => setDialog({ id: row.id!, edit: true }),
                  onDelete: askDelete,
                  quiet: list.rowActionsStyle === 'quiet'
                }
              : undefined
          }
          openable={!def.source}
          rowSx={rowStyler(list.rowStyles, def.fields)}
          onOpen={inDialog ? (row) => setDialog({ id: row.id! }) : undefined}
          inlineEdit={inlineEdit}
          opening={opening}
        />
      )}

      {data && data.meta.total === 0 && (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">{q || where ? 'Nenhum resultado com estes filtros.' : 'Nada cadastrado ainda.'}</Typography>
        </Box>
      )}

      <TablePagination
        component="div"
        count={data?.meta.total ?? 0}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={PAGE_SIZES}
        onPageChange={(_, p) => set({ page: String(p + 1) }, false)}
        onRowsPerPageChange={(e) => set({ pageSize: e.target.value })}
      />
      {deleteDialog}
      <EntityDialog
        open={dialog}
        entity={entity}
        onClose={(changed) => {
          setDialog(null);
          if (changed) mutate();
        }}
      />
    </Panel>
  );
}
