import { useRef, useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useSWRConfig } from 'swr';

// material-ui
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { notify } from '@c3theme/ui';
import { useEngine, useText } from '../../context';
import type { EnumValue, WireRecord } from '../../types';
import { quickCreate } from './quickCreate';
import { availableViews, boardColumns, canMoveCards, cardFields } from '../../views';
import AddButton from '../../widgets/AddButton';
import EntityDialog from '../EntityDialog';
import { PresetChips, ViewSwitcher } from '../views/ViewBar';
import { useViewPreset } from '../views/useViewPreset';
import BoardColumn from './BoardColumn';
import { useMoveCard } from './useMoveCard';
import { useLive } from '../../live/useLive';

/** Quadro (kanban) da entidade, montado por `views.board`: uma coluna por valor do enum, cartões arrastáveis. */
export default function EntityBoard({ entity }: { entity: string }) {
  const { client, entities } = useEngine();
  const { def, capabilities } = entities[entity];
  useLive(def);
  const text = useText();
  const { mutate } = useSWRConfig();
  const board = def.views?.board;
  const { preset, presetId, setPreset } = useViewPreset(def);
  const { pending, move } = useMoveCard(entity, board?.groupBy ?? '');
  // linhas na tela de cada coluna: o arrastar só informa o id, e o cartão em trânsito precisa do registro
  const shown = useRef(new Map<string, WireRecord[]>());
  const [dialog, setDialog] = useState<{ id?: string; edit?: boolean; initial?: WireRecord } | null>(null);

  if (!board) return <Alert severity="warning">{`${text(def.label.plural)} não declara views.board.`}</Alert>;

  const columns = boardColumns(def);
  const draggable = canMoveCards(def, capabilities);
  const fields = cardFields(def, board.fields);
  const titleField = def.titleField ?? def.fields.find((f) => f.type === 'string')?.name;
  const quickAdd = capabilities.create && board.quickAdd !== false && titleField !== undefined;
  const reload = () => mutate((key) => Array.isArray(key) && key[0] === 'c3-list' && key[1] === entity);

  // cartão só com o título; se o sistema pede mais (obrigatório, validação), abre o formulário com o que já tem
  async function addCard(value: EnumValue, title: string) {
    const out = await quickCreate(client, entity, { ...preset?.defaults, [titleField!]: title, [board!.groupBy]: value });
    if (out.kind === 'created') {
      notify('Cartão criado.');
      reload();
    } else if (out.kind === 'form') setDialog({ initial: out.initial });
    else notify(out.message, 'error');
  }

  const onDragEnd = ({ source, destination, draggableId }: DropResult) => {
    if (!destination || destination.droppableId === source.droppableId) return;
    const target = columns.find((c) => String(c.value) === destination.droppableId);
    const row = shown.current.get(source.droppableId)?.find((r) => r.id === draggableId);
    if (target && row) move(row, source.droppableId, target.value);
  };
  // barra só com o que existe: presets, troca de visão, criar (sem o "Adicionar cartão") e o aviso de leitura
  const switcher = availableViews(def).length > 1;
  const bar = (def.views?.list?.presets?.length ?? 0) > 0 || switcher || (capabilities.create && !quickAdd) || !draggable;

  return (
    <Stack spacing={2}>
      {bar && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          <Stack sx={{ flex: 1, minWidth: 0, '& > *': { px: '0 !important', pb: '0 !important' } }}>
            <PresetChips def={def} presetId={presetId} onChange={setPreset} />
          </Stack>
          {!draggable && (
            <Typography variant="body2" color="text.secondary">
              Somente leitura
            </Typography>
          )}
          <ViewSwitcher def={def} current="board" preset={presetId} />
          {!quickAdd && <AddButton entity={entity} preset={presetId} />}
        </Stack>
      )}
      <DragDropContext onDragEnd={onDragEnd}>
        <Stack direction="row" spacing={2} sx={{ pb: 2, overflowX: 'auto', alignItems: 'flex-start', minHeight: 420 }}>
          {columns.map((c) => {
            const key = String(c.value);
            return (
              <BoardColumn
                key={key}
                def={def}
                column={c}
                base={preset?.where}
                fields={fields}
                draggable={draggable}
                incoming={pending.filter((m) => m.to === key).map((m) => m.row)}
                outgoing={new Set(pending.filter((m) => m.from === key).map((m) => m.row.id!))}
                onRows={(rows) => shown.current.set(key, rows)}
                onOpen={(row) => setDialog({ id: row.id, edit: capabilities.update })}
                onQuickAdd={quickAdd ? (title) => addCard(c.value, title) : undefined}
              />
            );
          })}
        </Stack>
      </DragDropContext>
      <EntityDialog
        open={dialog && { id: dialog.id, edit: dialog.edit }}
        entity={entity}
        initial={dialog?.initial}
        onClose={(changed) => {
          setDialog(null);
          if (changed) reload();
        }}
      />
    </Stack>
  );
}
