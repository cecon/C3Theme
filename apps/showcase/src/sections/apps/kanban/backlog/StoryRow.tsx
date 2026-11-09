import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { Draggable } from '@hello-pangea/dnd';
import { Add, ArrowDown2, Edit2, Menu as GripIcon, More, Trash } from 'iconsax-reactjs';

import { notify, StatusChip } from '@c3theme/ui';
import CommentList from '../CommentList';
import { CURRENT_USER, Story, storyCode } from '../data';
import { newId, useKanban } from '../KanbanContext';
import { InlineAdd } from '@c3theme/ui';
import { ConfirmDialog, DueChip, MemberAvatar, PriorityChip } from '../shared';
import ItemList from './ItemList';
import { columnTone } from './status';

interface StoryRowProps {
  story: Story;
  index: number;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

/** Uma história do backlog: linha resumida e, expandida, descrição, critérios, itens e comentários. */
export default function StoryRow({ story, index, open, onToggle, onEdit }: StoryRowProps) {
  const { data, dispatch } = useKanban();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [confirm, setConfirm] = useState(false);
  // cada clique em "+" remonta o campo já aberto
  const [addSignal, setAddSignal] = useState(0);
  const column = data.columns[story.columnId];
  const doneColumn = data.doneColumnId ? data.columns[data.doneColumnId] : undefined;
  const doneItems = story.cardIds.filter((id) => doneColumn?.cardIds.includes(id)).length;

  function addItem(title: string) {
    const columnId = data.columnOrder[0];
    if (!columnId) {
      notify('Crie uma coluna no quadro antes de adicionar itens.', 'warning');
      return;
    }
    dispatch({
      type: 'addCard',
      columnId,
      storyId: story.id,
      card: { id: newId('c'), title, description: '', assigneeId: null, priority: 'media', due: null, comments: [], attachments: [] }
    });
    notify(`Item adicionado em ${storyCode(story.code)}.`, 'success');
  }

  return (
    <Draggable draggableId={`story:${story.id}`} index={index}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          sx={(theme) => ({
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: open ? `rgb(${theme.vars.palette.primary.mainChannel} / 0.03)` : 'background.paper',
            ...(snapshot.isDragging && { boxShadow: theme.shadows[12], bgcolor: 'background.paper', borderRadius: 2 })
          })}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: { xs: 1, sm: 2 }, py: 1.25 }}>
            <Box
              {...provided.dragHandleProps}
              aria-label={`Arrastar ${storyCode(story.code)}`}
              sx={{ display: 'flex', color: 'text.secondary', cursor: 'grab', p: 0.5, borderRadius: 1 }}
            >
              <GripIcon size={16} />
            </Box>
            <IconButton size="small" aria-label={open ? 'Recolher história' : 'Expandir história'} aria-expanded={open} onClick={onToggle}>
              <ArrowDown2 size={16} style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform .2s' }} />
            </IconButton>

            <Box sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onToggle}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, flexShrink: 0 }}>
                  {storyCode(story.code)}
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: { xs: 'normal', lg: 'nowrap' } }}
                >
                  {story.title}
                </Typography>
              </Stack>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: 'center',
                  mt: 0.5,
                  display: { xs: 'flex', lg: 'none' },
                  flexWrap: 'wrap',
                  gap: 0.75,
                  '& > *': { m: '0 !important' }
                }}
              >
                {column && <StatusChip label={column.title} tone={columnTone(data, column.id)} />}
                <PriorityChip priority={story.priority} />
                <Typography variant="caption" color="text.secondary">
                  {doneItems}/{story.cardIds.length} itens
                </Typography>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', display: { xs: 'none', lg: 'flex' }, flexShrink: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ width: 64, textAlign: 'end' }}>
                {doneItems}/{story.cardIds.length} itens
              </Typography>
              <Box sx={{ width: 120 }}>{column && <StatusChip label={column.title} tone={columnTone(data, column.id)} />}</Box>
              <Box sx={{ width: 64 }}>
                <PriorityChip priority={story.priority} />
              </Box>
              <Box sx={{ width: 76 }}>{story.due && <DueChip due={story.due} done={story.columnId === data.doneColumnId} />}</Box>
            </Stack>
            <MemberAvatar member={data.members.find((m) => m.id === story.assigneeId)} />
            <Tooltip title="Adicionar item">
              <IconButton
                size="small"
                aria-label={`Adicionar item em ${storyCode(story.code)}`}
                onClick={() => {
                  setAddSignal((n) => n + 1);
                  if (!open) onToggle();
                }}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                <Add size={18} />
              </IconButton>
            </Tooltip>
            <IconButton size="small" aria-label={`Opções de ${storyCode(story.code)}`} onClick={(e) => setAnchor(e.currentTarget)}>
              <More size={18} />
            </IconButton>
          </Stack>

          <Collapse in={open} unmountOnExit>
            <Grid container spacing={3} sx={{ px: { xs: 2, sm: 3 }, pb: 3, pt: 1, pl: { sm: 10 } }}>
              <Grid size={{ xs: 12, lg: 7 }}>
                <Stack spacing={2.5}>
                  {story.description && (
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        Descrição
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {story.description}
                      </Typography>
                    </Box>
                  )}
                  {story.acceptance && (
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        Critérios de aceitação
                      </Typography>
                      <Box component="ul" sx={{ m: 0, pl: 2.5, '& li': { typography: 'body2', mb: 0.25 } }}>
                        {story.acceptance
                          .split('\n')
                          .filter((l) => l.trim())
                          .map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                      </Box>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Itens ({story.cardIds.length})
                    </Typography>
                    <ItemList
                      droppableId={`story:${story.id}`}
                      cardIds={story.cardIds}
                      empty="Nenhum item. Adicione um ou arraste de outra história."
                    />
                    <Box sx={{ mt: 1 }}>
                      <InlineAdd
                        key={addSignal}
                        defaultOpen={addSignal > 0}
                        label="Adicionar item"
                        placeholder="Título do item"
                        onAdd={addItem}
                      />
                    </Box>
                  </Box>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, lg: 5 }}>
                <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Comentários ({story.comments.length})
                </Typography>
                <CommentList
                  comments={story.comments}
                  members={data.members}
                  onAdd={(text) =>
                    dispatch({
                      type: 'addStoryComment',
                      storyId: story.id,
                      comment: { id: newId('k'), authorId: CURRENT_USER, text, at: new Date() }
                    })
                  }
                />
              </Grid>
            </Grid>
          </Collapse>

          <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
            <MenuItem
              onClick={() => {
                setAnchor(null);
                onEdit();
              }}
            >
              <ListItemIcon>
                <Edit2 size={18} />
              </ListItemIcon>
              Editar história
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
              Excluir história
            </MenuItem>
          </Menu>

          <ConfirmDialog
            open={confirm}
            title={`Excluir ${storyCode(story.code)}?`}
            onCancel={() => setConfirm(false)}
            onConfirm={() => {
              setConfirm(false);
              dispatch({ type: 'deleteStory', id: story.id });
              notify('História excluída.', 'success');
            }}
          >
            “{story.title}” será excluída.{' '}
            {story.cardIds.length > 0 && `Os ${story.cardIds.length} itens continuam no quadro, sem história.`}
          </ConfirmDialog>
        </Box>
      )}
    </Draggable>
  );
}
