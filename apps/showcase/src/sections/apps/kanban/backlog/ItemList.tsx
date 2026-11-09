// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Menu as GripIcon } from 'iconsax-reactjs';

import { StatusChip } from '@c3theme/ui';
import { useKanban } from '../KanbanContext';
import { MemberAvatar, PriorityChip } from '../shared';
import { columnTone } from './status';

interface ItemListProps {
  /** Id do Droppable: `story:<id>` ou `story:none`. */
  droppableId: string;
  cardIds: string[];
  empty: string;
}

/** Itens (cartões do quadro) de uma história; arraste para reordenar ou mover entre histórias. */
export default function ItemList({ droppableId, cardIds, empty }: ItemListProps) {
  const { data, openCard, columnOf } = useKanban();

  return (
    <Droppable droppableId={droppableId} type="ITEM">
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.droppableProps}
          sx={(theme) => ({
            minHeight: 48,
            borderRadius: 2,
            border: 1,
            borderColor: snapshot.isDraggingOver ? 'primary.main' : 'divider',
            borderStyle: snapshot.isDraggingOver ? 'dashed' : 'solid',
            bgcolor: snapshot.isDraggingOver ? `rgb(${theme.vars.palette.primary.mainChannel} / 0.04)` : 'background.paper',
            overflow: 'hidden'
          })}
        >
          {cardIds.length === 0 && !snapshot.isDraggingOver && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
              {empty}
            </Typography>
          )}
          {cardIds.map((id, index) => {
            const card = data.cards[id];
            if (!card) return null;
            const column = columnOf(id);
            return (
              <Draggable key={id} draggableId={`item:${id}`} index={index}>
                {(drag, dragSnapshot) => (
                  <Stack
                    ref={drag.innerRef}
                    {...drag.draggableProps}
                    direction="row"
                    spacing={1.25}
                    sx={(theme) => ({
                      alignItems: 'center',
                      px: 1.25,
                      py: 1,
                      bgcolor: 'background.paper',
                      borderBottom: 1,
                      borderColor: 'divider',
                      '&:last-of-type': { borderBottom: 0 },
                      ...(dragSnapshot.isDragging && { boxShadow: theme.shadows[8], borderRadius: 2, border: 0 })
                    })}
                  >
                    <Box
                      {...drag.dragHandleProps}
                      aria-label={`Arrastar ${card.title}`}
                      sx={{ display: 'flex', color: 'text.secondary', cursor: 'grab', p: 0.5, borderRadius: 1 }}
                    >
                      <GripIcon size={16} />
                    </Box>
                    <Typography
                      component="button"
                      type="button"
                      variant="body2"
                      onClick={() => openCard(id)}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        textAlign: 'start',
                        border: 0,
                        p: 0,
                        bgcolor: 'transparent',
                        color: 'text.primary',
                        fontWeight: 500,
                        cursor: 'pointer',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        '&:hover': { color: 'primary.main', textDecoration: 'underline' }
                      }}
                    >
                      {card.title || 'Sem título'}
                    </Typography>
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                      {column && <StatusChip label={column.title} tone={columnTone(data, column.id)} />}
                    </Box>
                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                      <PriorityChip priority={card.priority} />
                    </Box>
                    <MemberAvatar member={data.members.find((m) => m.id === card.assigneeId)} size="xs" />
                  </Stack>
                )}
              </Draggable>
            );
          })}
          {provided.placeholder}
        </Box>
      )}
    </Droppable>
  );
}
