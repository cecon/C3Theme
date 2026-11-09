// material-ui
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Draggable } from '@hello-pangea/dnd';
import { MessageText1, Paperclip2 } from 'iconsax-reactjs';

import { Card, storyCode } from '../data';
import { useKanban } from '../KanbanContext';
import { DueChip, MemberAvatar, PriorityChip } from '../shared';

function Counter({ icon: Icon, value, label }: { icon: typeof Paperclip2; value: number; label: string }) {
  if (!value) return null;
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }} aria-label={`${value} ${label}`}>
      <Icon size={14} />
      <Typography variant="caption">{value}</Typography>
    </Stack>
  );
}

/** Cartão do quadro: arrastável; clique abre os detalhes. */
export default function BoardCard({ card, index, done }: { card: Card; index: number; done: boolean }) {
  const { data, openCard, storyOf } = useKanban();
  const story = storyOf(card.id);
  const member = data.members.find((m) => m.id === card.assigneeId);

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          variant="outlined"
          role="button"
          aria-label={`Abrir cartão ${card.title}`}
          onClick={() => openCard(card.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') openCard(card.id);
          }}
          sx={(theme) => ({
            p: 1.5,
            mb: 1.25,
            borderRadius: 2,
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'box-shadow .15s, border-color .15s',
            '&:hover': { borderColor: theme.vars.palette.primary.main },
            '&:focus-visible': { outline: `2px solid ${theme.vars.palette.primary.main}`, outlineOffset: 1 },
            ...(snapshot.isDragging && { boxShadow: theme.shadows[8], borderColor: theme.vars.palette.primary.main })
          })}
        >
          {story && (
            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              {storyCode(story.code)}
            </Typography>
          )}
          <Typography
            variant="subtitle2"
            sx={{ overflowWrap: 'anywhere', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.75 : 1 }}
          >
            {card.title || 'Sem título'}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75, mt: 1.25, '& > *': { m: '0 !important' } }}>
            <PriorityChip priority={card.priority} />
            {card.due && <DueChip due={card.due} done={done} />}
          </Stack>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 1.25 }}>
            <Stack direction="row" spacing={1.5}>
              <Counter icon={MessageText1} value={card.comments.length} label="comentários" />
              <Counter icon={Paperclip2} value={card.attachments.length} label="anexos" />
            </Stack>
            <Box sx={{ ml: 'auto' }}>
              <MemberAvatar member={member} size="xs" />
            </Box>
          </Stack>
        </Paper>
      )}
    </Draggable>
  );
}
