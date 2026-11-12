import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

import {
  AssistantPanel,
  LanePanel,
  useChatText,
  useMessageWindow,
  type AssistantChat,
  type AssistantPanelProps,
  type Author,
  type ChatTransport
} from '@c3theme/chat';

import { hasAside, laneActions, lanesApi, runLaneAction, type WireLane } from '../agent/lanes';
import { ApiError } from '../apiError';
import { useEngine, useText } from '../context';
import type { ChatDef } from './chatDef';

interface Props {
  def: ChatDef;
  chat: AssistantChat;
  transport: ChatTransport;
  me: Author;
  panel: Omit<AssistantPanelProps, 'chat'>;
}

/** Liga as conversas declaradas às rotas do motor; a principal continua montada enquanto uma filha abre. */
export default function ChatLanes({ def, chat, transport, me, panel }: Props) {
  const { client } = useEngine();
  const text = useText();
  const t = useChatText();
  const api = useMemo(() => lanesApi(client), [client]);
  const actions = useMemo(() => laneActions(def, text, t('c3.chat.lanes.branchFrom')), [def, text, t]);
  const [lanes, setLanes] = useState<WireLane[]>([]);
  const [selected, setSelected] = useState<string>();
  const [available, setAvailable] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const enabled = !!api && available;
  const showLanes = enabled && (!!def.lanes || lanes.length > 0);

  useEffect(() => {
    if (!api || !def.lanes) return;
    let live = true;
    void api.list(chat.conversationId).then(
      (items) => live && setLanes(items),
      (e: unknown) => {
        if (!live) return;
        if (e instanceof ApiError && e.status === 404) setAvailable(false);
        else setError(e instanceof Error ? e.message : 'Não foi possível abrir as conversas.');
      }
    );
    return () => {
      live = false;
    };
  }, [api, def.lanes, chat.conversationId, chat.messages.length, chat.generating]);

  async function run(work: () => Promise<{ lane?: WireLane; message?: string } | undefined>) {
    if (pending) return false;
    setPending(true);
    setError('');
    try {
      const result = await work();
      if (result?.lane) {
        const lane = result.lane;
        setLanes((items) => [...items.filter((l) => l.id !== lane.id), lane]);
        setSelected(lane.id);
      }
      if (result?.message) setError(result.message);
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setAvailable(false);
      setError(e instanceof Error ? e.message : 'Não foi possível abrir a conversa.');
      return false;
    } finally {
      setPending(false);
    }
  }

  const aside =
    enabled && hasAside(def) && !pending
      ? (value: string) => run(async () => ({ lane: await api!.open(chat.conversationId, { kind: 'aside', text: value || undefined }) }))
      : undefined;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {error && (
        <Alert severity="info" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: showLanes ? { xs: '1fr', md: '1fr 1fr' } : '1fr', flex: 1, minHeight: 0 }}>
        <Box sx={{ minWidth: 0, minHeight: 0 }}>
          <AssistantPanel
            {...panel}
            chat={chat}
            messageActions={enabled && !pending ? actions : []}
            onMessageAction={enabled ? (m, id) => void run(() => runLaneAction(api!, actions, chat.conversationId, m.id, id)) : undefined}
            onAside={aside}
          />
        </Box>
        {showLanes && (
          <Box sx={{ minWidth: 0, minHeight: { xs: 360, md: 0 }, borderLeft: 1, borderColor: 'divider' }}>
            <LaneConversation
              key={selected ?? 'list'}
              transport={transport}
              me={me}
              lanes={lanes}
              selected={selected}
              onSelect={setSelected}
              onBack={() => setSelected(undefined)}
              title={def.lanes?.label === undefined ? undefined : text(def.lanes.label)}
              onNew={aside && (() => aside(''))}
              panel={panel}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

function LaneConversation(props: {
  transport: ChatTransport;
  me: Author;
  lanes: WireLane[];
  selected?: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  title?: string;
  onNew?: () => void;
  panel: Omit<AssistantPanelProps, 'chat'>;
}) {
  // A lista não abre nem assina outra sala. Só o componente selecionado usa o transporte.
  if (props.selected) return <SelectedLane {...props} selected={props.selected} />;
  return <LanePanel lanes={props.lanes} onSelect={props.onSelect} onBack={props.onBack} title={props.title} onNewAside={props.onNew} />;
}

function SelectedLane(props: Parameters<typeof LaneConversation>[0] & { selected: string }) {
  const chat = useMessageWindow(props.transport, props.selected, { me: props.me });
  const { onClose: _close, title: _title, entregaDaUltimaMensagem: _delivery, empty: _empty, ...panel } = props.panel;
  return (
    <LanePanel
      lanes={props.lanes}
      selectedId={props.selected}
      chat={chat}
      onSelect={props.onSelect}
      onBack={props.onBack}
      title={props.title}
      onNewAside={props.onNew}
      panel={panel}
    />
  );
}
