import { useMemo, useState } from 'react';

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

import { laneActions, runLaneAction, type WireLane } from '../agent/lanes';
import { useText } from '../context';
import type { ChatDef } from './chatDef';
import usePinned from './usePinned';
import { rereadMessage } from './pinned';
import useLanes from './useLanes';
import ChatTabs from './tabs/ChatTabs';

interface Props {
  def: ChatDef;
  chat: AssistantChat;
  transport: ChatTransport;
  me: Author;
  panel: Omit<AssistantPanelProps, 'chat'>;
}

/** Liga as conversas declaradas às rotas do motor; a principal continua montada enquanto uma filha abre. */
export default function ChatLanes({ def, chat, transport, me, panel }: Props) {
  const text = useText();
  const t = useChatText();
  const actions = useMemo(() => laneActions(def, text, t('c3.chat.lanes.branchFrom')), [def, text, t]);
  const [revision, setRevision] = useState(0);
  const pinned = usePinned(def, chat, revision);
  const state = useLanes(def, chat);
  const { api, lanes, selected, setSelected, enabled, error, clearError, pending, run, aside } = state;
  const showLanes = enabled && (!!def.lanes || lanes.length > 0) && !def.tabs;
  const main = (
    <AssistantPanel
      {...panel}
      chat={chat}
      actions={
        <>
          {panel.actions}
          {pinned.actions}
        </>
      }
      jumpTo={pinned.jumpTo}
      messageActions={enabled && !pending ? actions : []}
      onMessageAction={
        enabled
          ? (m, id) =>
              void run(async () => {
                const result = await runLaneAction(api!, actions, chat.conversationId, m.id, id);
                if (!actions.find((a) => a.id === id)?.opens) {
                  const fresh = await rereadMessage(transport, chat.conversationId, m.id);
                  if (fresh) chat.putMessage?.(fresh);
                  setRevision((n) => n + 1);
                }
                return result;
              })
          : undefined
      }
      onAside={aside}
    />
  );
  // com abas declaradas, as threads abrem em abas no painel central em vez do painel ao lado (#134)
  if (def.tabs)
    return (
      <ChatTabs
        def={{ ...def, tabs: def.tabs }}
        conversationId={chat.conversationId}
        main={main}
        mainTitle={typeof panel.title === 'string' ? panel.title : 'Assistente'}
        lanes={state}
        transport={transport}
        me={me}
        panel={panel}
      />
    );
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {error && (
        <Alert severity="info" onClose={clearError}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: showLanes ? { xs: '1fr', md: '1fr 1fr' } : '1fr', flex: 1, minHeight: 0 }}>
        <Box sx={{ minWidth: 0, minHeight: 0 }}>{main}</Box>
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
