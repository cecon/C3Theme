import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Droppable } from '@hello-pangea/dnd';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { TickCircle } from 'iconsax-reactjs';

import { InlineAdd } from '@c3theme/ui';
import { useEngine, useText } from '../../context';
import type { Condition, EntityDef, FieldDef, WireRecord } from '../../types';
import { BoardColumn as Column, columnWhere, defaultSortParam, listUpTo } from '../../views';
import BoardCard from './BoardCard';

interface BoardColumnProps {
  def: EntityDef;
  column: Column;
  base?: Condition;
  fields: FieldDef[];
  draggable: boolean;
  /** Cartões arrastados para esta coluna e ainda gravando: aparecem já aqui, no topo. */
  incoming: WireRecord[];
  /** Ids que saíram desta coluna e ainda gravam: somem daqui na hora. */
  outgoing: Set<string>;
  /** Avisa o quadro quais registros estão na tela (para saber qual foi arrastado). */
  onRows: (rows: WireRecord[]) => void;
  onOpen: (row: WireRecord) => void;
  /** "Adicionar cartão" no pé: cria com o título nesta coluna. */
  onQuickAdd?: (title: string) => void;
}

/** Uma coluna do quadro: GET da lista com o valor da coluna, em lotes de `pageSize` ("Ver mais"). */
export default function BoardColumn(props: BoardColumnProps) {
  const { def, column, base, fields, draggable, incoming, outgoing, onRows, onOpen, onQuickAdd } = props;
  const { client, org, icons } = useEngine();
  const text = useText();
  const step = def.views?.board?.pageSize ?? 50;
  const [limit, setLimit] = useState(step);
  const where = columnWhere(def.views!.board!.groupBy, column.value, base);
  const { data, error, isLoading } = useSWR(
    ['c3-list', def.name, 'board', String(column.value), JSON.stringify(where), limit, org?.active],
    () => listUpTo(client, def.name, { where, sort: defaultSortParam(def) }, limit),
    { keepPreviousData: true }
  );
  const rows = [...incoming, ...(data?.rows ?? []).filter((r) => !outgoing.has(r.id!) && !incoming.some((i) => i.id === r.id))];
  const total = data ? data.total - outgoing.size + incoming.length : undefined;
  const label = text(column.label, String(column.value));
  const done = def.views!.board!.done === column.value;
  useEffect(() => {
    onRows(rows);
  });

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-label={label}
      sx={(theme) => ({
        width: { xs: 272, md: 300 },
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        bgcolor: theme.vars.palette.background.default
      })}
    >
      <Stack direction="row" spacing={1} sx={{ px: 2, pt: 1.5, pb: 1, minHeight: 52, alignItems: 'center' }}>
        <Typography variant="subtitle1" noWrap>
          {label}
        </Typography>
        {done && (
          <Box component="span" role="img" sx={{ display: 'flex', color: 'success.main' }} aria-label="Coluna de concluídos">
            <TickCircle size={16} variant="Bold" />
          </Box>
        )}
        {total !== undefined && <Chip size="small" label={total} sx={{ height: 22 }} />}
      </Stack>
      {error && (
        <Alert severity="error" sx={{ mx: 1, mb: 1 }}>
          {error.message}
        </Alert>
      )}
      <Droppable droppableId={String(column.value)} isDropDisabled={!draggable}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={(theme) => ({
              px: 1.25,
              pt: 0.5,
              mx: 0.5,
              minHeight: 80,
              borderRadius: 2,
              transition: 'background-color .15s',
              bgcolor: snapshot.isDraggingOver ? `rgb(${theme.vars.palette.primary.mainChannel} / 0.06)` : 'transparent'
            })}
          >
            {isLoading && !data && [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={72} sx={{ mb: 1 }} />)}
            {rows.map((row, i) => (
              <BoardCard
                key={row.id}
                def={def}
                row={row}
                index={i}
                fields={fields}
                draggable={draggable}
                done={done}
                onOpen={onOpen}
                icons={icons}
              />
            ))}
            {provided.placeholder}
            {data && rows.length === 0 && !snapshot.isDraggingOver && !onQuickAdd && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                Nenhum registro
              </Typography>
            )}
          </Box>
        )}
      </Droppable>
      {data && data.total > data.rows.length && (
        <Button size="small" onClick={() => setLimit((l) => l + step)} sx={{ m: 1, mt: 0 }}>
          {`Ver mais (${data.total - data.rows.length})`}
        </Button>
      )}
      {onQuickAdd && (
        <Box sx={{ p: 1.25, pt: 0.5 }}>
          <InlineAdd label="Adicionar cartão" placeholder="Título do cartão" onAdd={onQuickAdd} />
        </Box>
      )}
    </Paper>
  );
}
