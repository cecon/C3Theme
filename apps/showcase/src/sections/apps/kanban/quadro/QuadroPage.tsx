// material-ui
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

// third-party
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';

import { notify } from '@c3theme/ui';
import { newId, useKanban } from '../KanbanContext';
import BoardColumn, { COLUMN_WIDTH } from './BoardColumn';
import { InlineAdd } from '@c3theme/ui';

export default function QuadroPage() {
  const { data, dispatch } = useKanban();

  function onDragEnd({ source, destination, draggableId, type }: DropResult) {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    if (type === 'COLUMN') {
      dispatch({ type: 'moveColumn', from: source.index, to: destination.index });
      return;
    }
    dispatch({ type: 'moveCard', cardId: draggableId, toColumn: destination.droppableId, toIndex: destination.index });
  }

  function addColumn(title: string) {
    dispatch({ type: 'addColumn', column: { id: newId('col'), title, cardIds: [] } });
    notify('Coluna criada.', 'success');
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="board" direction="horizontal" type="COLUMN">
        {(provided) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              overflowX: 'auto',
              pb: 2,
              minHeight: 420
            }}
          >
            {data.columnOrder.map((id, i) => (
              <BoardColumn key={id} column={data.columns[id]} index={i} done={id === data.doneColumnId} />
            ))}
            {provided.placeholder}
            <Paper
              variant="outlined"
              sx={{ width: COLUMN_WIDTH, flexShrink: 0, p: 1.25, borderRadius: 3, borderStyle: 'dashed', bgcolor: 'transparent' }}
            >
              <InlineAdd label="Adicionar coluna" placeholder="Nome da coluna" onAdd={addColumn} />
            </Paper>
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  );
}
