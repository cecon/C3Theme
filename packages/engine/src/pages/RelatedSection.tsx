import { useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

// third-party
import { Add } from 'iconsax-reactjs';

import { Panel, TableSkeletonRows } from '@c3theme/ui';
import { useEngine, useText } from '../context';
import { findOption } from '../format';
import type { ColumnDef, RelatedDef, Text } from '../types';
import { columnCell } from '../skeletonShape';
import EntityDialog from './EntityDialog';
import { Cell } from './list/Cell';
import EditBar from './list/EditBar';
import { EditCell } from './list/EditCell';
import useInlineEdit from './list/useInlineEdit';
import RelatedToolbar from './RelatedToolbar';

const PAGE_SIZE = 10;

/** Seção `related`: filhos do registro, com adicionar/editar num diálogo pelo CRUD normal da entidade filha. */
export default function RelatedSection({ parentId, related, title }: { parentId: string; related: RelatedDef; title?: Text }) {
  const { client, entities } = useEngine();
  const text = useText();
  const intl = useIntl();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<{ id?: string } | null>(null);
  const child = entities[related.entity];

  const listDef = child?.def.views?.list;
  const [q, setQ] = useState('');
  const [presetId, setPresetId] = useState(related.presets ? (listDef?.presets?.find((p) => p.default)?.id ?? '') : '');
  const preset = listDef?.presets?.find((p) => p.id === presetId);
  const sort = related.sort ?? (listDef?.defaultSort ?? []).map((s) => (s.direction === 'desc' ? '-' : '') + s.field).join(',');
  const own = { field: related.field, op: 'eq' as const, value: parentId };
  const where = preset ? { and: [own, preset.where] } : own;
  const key = child ? ['c3-list', related.entity, 'related', related.field, parentId, page, sort, q, presetId] : null;
  const { data, mutate } = useSWR(key, () =>
    client.list(related.entity, { page, pageSize: PAGE_SIZE, sort: sort || undefined, q: q || undefined, where })
  );
  const edit = useInlineEdit(
    related.entity,
    child?.def ?? { name: related.entity, label: { singular: '', plural: '' }, fields: [] },
    () => void mutate()
  );
  const mode = related.editMode ?? 'instant';
  // Enter desce para a mesma coluna da linha de baixo, como na grade do input
  const down = (i: number, field: string) => () =>
    document.querySelector<HTMLElement>(`[data-edit-cell="${data?.data[i + 1]?.id}:${field}"] input`)?.focus();

  if (!child) return null;
  const { def, capabilities } = child;
  const names =
    related.columns ??
    (listDef?.columns ?? def.fields.slice(0, 5).map((f) => f.name)).map((c: ColumnDef) => (typeof c === 'string' ? c : c.field));
  const columns = names
    .filter((n) => n !== related.field)
    .map((n) => def.fields.find((f) => f.name === n)!)
    .filter(Boolean);
  const optionLabel = (name: string) => (v: string) =>
    text(
      findOption(
        def.fields.find((f) => f.name === name),
        v
      )?.label,
      v
    );

  return (
    <Panel
      title={text(title ?? def.label.plural)}
      flush
      action={
        capabilities.create && (
          <Button size="small" startIcon={<Add />} onClick={() => setOpen({})}>
            Adicionar
          </Button>
        )
      }
    >
      <RelatedToolbar
        def={def}
        search={related.search}
        presets={related.presets}
        q={q}
        onSearch={(v) => {
          setQ(v);
          setPage(1);
        }}
        preset={presetId}
        onPreset={(id) => {
          setPresetId(id);
          setPage(1);
        }}
      />
      {mode === 'batch' && <EditBar edit={edit} />}
      <TableContainer>
        <Table size="small" aria-busy={!data || undefined}>
          <TableHead>
            <TableRow>
              {columns.map((f) => (
                <TableCell key={f.name}>{text(f.label, f.name)}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {!data && <TableSkeletonRows rows={3} columns={columns.map(columnCell)} />}
            {data?.data.map((row, i) => (
              <TableRow key={row.id} hover sx={{ cursor: 'pointer' }} onClick={() => setOpen({ id: row.id })}>
                {columns.map((f) => {
                  const cell = <Cell field={f} row={row} locale={intl.locale} optionLabel={optionLabel(f.name)} />;
                  return (
                    <TableCell key={f.name} sx={related.editable?.includes(f.name) ? { py: 0.5, minWidth: 120 } : undefined}>
                      {related.editable?.includes(f.name) ? (
                        <EditCell
                          entity={related.entity}
                          field={f}
                          row={row}
                          mode={mode}
                          edit={edit}
                          readView={cell}
                          onEnter={down(i, f.name)}
                        />
                      ) : (
                        cell
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {data && data.meta.total === 0 && (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">{q || preset ? 'Nenhum resultado com estes filtros.' : 'Nada cadastrado ainda.'}</Typography>
        </Box>
      )}
      {data && data.meta.total > PAGE_SIZE && (
        <TablePagination
          component="div"
          count={data.meta.total}
          page={page - 1}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[PAGE_SIZE]}
          onPageChange={(_, p) => setPage(p + 1)}
        />
      )}

      <EntityDialog
        open={open}
        entity={related.entity}
        fixed={{ [related.field]: parentId }}
        onClose={(changed) => {
          setOpen(null);
          if (changed) mutate();
        }}
      />
    </Panel>
  );
}
