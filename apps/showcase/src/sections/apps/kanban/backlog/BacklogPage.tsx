import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';
import { Add, ArrowDown2, ArrowUp2 } from 'iconsax-reactjs';

import { notify, Panel } from '@c3theme/ui';
import { Story, storyCode } from '../data';
import { useKanban } from '../KanbanContext';
import ItemList from './ItemList';
import StoryDialog from './StoryDialog';
import StoryRow from './StoryRow';

const NO_STORY = 'story:none';

export default function BacklogPage() {
  const { data, dispatch } = useKanban();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(data.storyOrder.slice(0, 1)));
  // undefined: fechado; null: nova história; Story: edição
  const [editing, setEditing] = useState<Story | null | undefined>(undefined);

  const inStories = new Set(Object.values(data.stories).flatMap((s) => s.cardIds));
  const loose = data.columnOrder.flatMap((id) => data.columns[id].cardIds).filter((id) => !inStories.has(id));
  const allOpen = data.storyOrder.length > 0 && data.storyOrder.every((id) => expanded.has(id));

  function toggle(id: string) {
    setExpanded((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onDragEnd({ source, destination, draggableId, type }: DropResult) {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    if (type === 'STORY') {
      dispatch({ type: 'moveStory', from: source.index, to: destination.index });
      return;
    }
    const cardId = draggableId.replace(/^item:/, '');
    const storyId = destination.droppableId === NO_STORY ? null : destination.droppableId.replace(/^story:/, '');
    dispatch({ type: 'setCardStory', cardId, storyId, toIndex: destination.index });
    if (source.droppableId !== destination.droppableId) {
      notify(storyId ? `Item movido para ${storyCode(data.stories[storyId].code)}.` : 'Item removido da história.', 'success');
    }
  }

  function saved(story: Story, created: boolean) {
    dispatch({ type: 'saveStory', story });
    notify(created ? 'História criada.' : 'História atualizada.', 'success');
    if (created) setExpanded((set) => new Set(set).add(story.id));
    setEditing(undefined);
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Stack spacing={2.5}>
        <Panel
          title="Histórias de usuário"
          subtitle={`${data.storyOrder.length} histórias · ${inStories.size} itens`}
          flush
          action={
            <Stack direction="row" spacing={1}>
              <Button
                color="secondary"
                size="small"
                startIcon={allOpen ? <ArrowUp2 size={16} /> : <ArrowDown2 size={16} />}
                onClick={() => setExpanded(allOpen ? new Set() : new Set(data.storyOrder))}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                {allOpen ? 'Recolher tudo' : 'Expandir tudo'}
              </Button>
              <Button variant="contained" size="small" startIcon={<Add size={18} />} onClick={() => setEditing(null)}>
                Nova história
              </Button>
            </Stack>
          }
        >
          <Droppable droppableId="stories" type="STORY">
            {(provided) => (
              <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ '& > :last-of-type': { borderBottom: 0 } }}>
                {data.storyOrder.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                    Nenhuma história. Crie a primeira para organizar o backlog.
                  </Typography>
                )}
                {data.storyOrder.map((id, i) => (
                  <StoryRow
                    key={id}
                    story={data.stories[id]}
                    index={i}
                    open={expanded.has(id)}
                    onToggle={() => toggle(id)}
                    onEdit={() => setEditing(data.stories[id])}
                  />
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </Panel>

        <Panel title="Itens sem história" subtitle="Arraste um item para dentro de uma história expandida.">
          <ItemList droppableId={NO_STORY} cardIds={loose} empty="Todos os itens do quadro pertencem a uma história." />
        </Panel>
      </Stack>

      {editing !== undefined && <StoryDialog story={editing ?? undefined} onClose={() => setEditing(undefined)} onSaved={saved} />}
    </DragDropContext>
  );
}
