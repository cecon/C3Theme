import { FormEvent, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Edit2, More, TickCircle, Trash } from 'iconsax-reactjs';

import { notify } from '@c3theme/ui';
import { Column } from '../data';
import { newId, useKanban } from '../KanbanContext';
import { ConfirmDialog } from '../shared';
import BoardCard from './BoardCard';
import { InlineAdd } from '@c3theme/ui';

export const COLUMN_WIDTH = { xs: 280, sm: 300 };

function ColumnTitle({ column, editing, onDone }: { column: Column; editing: boolean; onDone: () => void }) {
  const { dispatch } = useKanban();
  const [title, setTitle] = useState(column.title);

  if (!editing) {
    return (
      <Typography variant="subtitle1" noWrap>
        {column.title}
      </Typography>
    );
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (title.trim() && title.trim() !== column.title) {
      dispatch({ type: 'renameColumn', id: column.id, title: title.trim() });
      notify('Coluna renomeada.', 'success');
    }
    onDone();
  }

  return (
    <Box component="form" onSubmit={submit} sx={{ flex: 1 }}>
      <TextField
        autoFocus
        size="small"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => submit()}
        onKeyDown={(e) => e.key === 'Escape' && onDone()}
        slotProps={{ htmlInput: { 'aria-label': 'Novo nome da coluna' } }}
        fullWidth
      />
    </Box>
  );
}

/** Coluna arrastável (pelo cabeçalho) com seus cartões. */
export default function BoardColumn({ column, index, done }: { column: Column; index: number; done: boolean }) {
  const { data, dispatch } = useKanban();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);

  function addCard(title: string) {
    const id = newId('c');
    dispatch({
      type: 'addCard',
      columnId: column.id,
      storyId: null,
      card: { id, title, description: '', assigneeId: null, priority: 'media', due: null, comments: [], attachments: [] }
    });
    notify('Cartão criado.', 'success');
  }

  return (
    <Draggable draggableId={`col:${column.id}`} index={index}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          variant="outlined"
          sx={(theme) => ({
            width: COLUMN_WIDTH,
            flexShrink: 0,
            mr: 2,
            borderRadius: 3,
            bgcolor: theme.vars.palette.background.default,
            display: 'flex',
            flexDirection: 'column',
            ...(snapshot.isDragging && { boxShadow: theme.shadows[12] })
          })}
        >
          <Stack
            direction="row"
            spacing={1}
            {...provided.dragHandleProps}
            aria-label={`Coluna ${column.title}; arraste para reordenar`}
            sx={{ alignItems: 'center', px: 2, pt: 1.5, pb: 1, minHeight: 52, cursor: 'grab' }}
          >
            <ColumnTitle column={column} editing={editing} onDone={() => setEditing(false)} />
            {done && !editing && (
              <Box component="span" sx={{ display: 'flex', color: 'success.main' }} aria-label="Coluna de concluídos">
                <TickCircle size={16} variant="Bold" />
              </Box>
            )}
            {!editing && <Chip size="small" label={column.cardIds.length} sx={{ height: 22 }} />}
            <IconButton
              size="small"
              aria-label={`Opções da coluna ${column.title}`}
              onClick={(e) => setAnchor(e.currentTarget)}
              sx={{ ml: 'auto !important' }}
            >
              <More size={18} />
            </IconButton>
          </Stack>

          <Droppable droppableId={column.id} type="CARD">
            {(drop, dropSnapshot) => (
              <Box
                ref={drop.innerRef}
                {...drop.droppableProps}
                sx={(theme) => ({
                  px: 1.25,
                  pt: 0.5,
                  minHeight: 80,
                  mx: 0.5,
                  borderRadius: 2,
                  transition: 'background-color .15s',
                  bgcolor: dropSnapshot.isDraggingOver ? `rgb(${theme.vars.palette.primary.mainChannel} / 0.06)` : 'transparent'
                })}
              >
                {column.cardIds.map((id, i) => data.cards[id] && <BoardCard key={id} card={data.cards[id]} index={i} done={done} />)}
                {drop.placeholder}
              </Box>
            )}
          </Droppable>

          <Box sx={{ p: 1.25, pt: 0.5 }}>
            <InlineAdd label="Adicionar cartão" placeholder="Título do cartão" onAdd={addCard} />
          </Box>

          <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
            <MenuItem
              onClick={() => {
                setAnchor(null);
                setEditing(true);
              }}
            >
              <ListItemIcon>
                <Edit2 size={18} />
              </ListItemIcon>
              Renomear
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchor(null);
                dispatch({ type: 'setDoneColumn', id: done ? null : column.id });
                notify(done ? 'A coluna deixou de contar como concluída.' : `“${column.title}” agora conta como concluída.`, 'success');
              }}
            >
              <ListItemIcon>
                <TickCircle size={18} />
              </ListItemIcon>
              {done ? 'Não contar como concluída' : 'Marcar como concluída'}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchor(null);
                setConfirm(true);
              }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>
                <Trash size={18} />
              </ListItemIcon>
              Excluir coluna
            </MenuItem>
          </Menu>

          <ConfirmDialog
            open={confirm}
            title="Excluir coluna?"
            onCancel={() => setConfirm(false)}
            onConfirm={() => {
              setConfirm(false);
              dispatch({ type: 'deleteColumn', id: column.id });
              notify('Coluna excluída.', 'success');
            }}
          >
            A coluna “{column.title}”
            {column.cardIds.length > 0 ? ` e seus ${column.cardIds.length} cartão(ões) serão excluídos.` : ' será excluída.'} Essa ação não
            pode ser desfeita.
          </ConfirmDialog>
        </Paper>
      )}
    </Draggable>
  );
}
