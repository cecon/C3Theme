// O assistente montado pela spec (`$defs/chat`, ADR 0005): o AssistantPanel do @c3theme/chat sobre o transporte do
// cliente do motor (`client.chat`), com as partes do motor e a telemetria da shell. Nenhum TS do sistema.

import { useMemo, useState } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

import { useMessageWindow, type Author, type ChatTransport, type UiRenderers } from '@c3theme/chat';

import { agentTaskOf, agentUiRenderers } from '../agent';
import { ApiError } from '../apiError';
import { useAuthSession } from '../auth/session';
import { useEngine, useText } from '../context';
import { chatRenderers, chatView, type ChatDef, type ChatView } from './chatDef';
import ChatLanes from './ChatLanes';

export interface ChatPanelProps {
  def: ChatDef;
  /** Botão de fechar no cabeçalho (gaveta do header). */
  onClose?: () => void;
}

const GUEST: Author = { id: 'me', name: 'Você' };

/** Avisa quando o backend não tem chat (404 ao abrir a conversa), para o painel dizer isso em vez de ficar vazio. */
export function watchMissing(transport: ChatTransport, onMissing: () => void): ChatTransport {
  return {
    ...transport,
    loadMessages: (...args) =>
      transport.loadMessages(...args).catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 404) onMissing();
        throw e;
      })
  };
}

export default function ChatPanel({ def, onClose }: ChatPanelProps) {
  const { client } = useEngine();
  const text = useText();
  const [missing, setMissing] = useState(false);
  const transport = useMemo(() => client.chat && watchMissing(client.chat, () => setMissing(true)), [client.chat]);
  const view = chatView(def, text);
  if (!transport || missing)
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">Este sistema não tem assistente.</Alert>
      </Box>
    );
  return <Conversation transport={transport} view={view} def={def} onClose={onClose} />;
}

function Conversation({ transport, view, def, onClose }: { transport: ChatTransport; view: ChatView; def: ChatDef; onClose?: () => void }) {
  const { telemetry } = useEngine();
  const user = useAuthSession()?.user;
  const me = useMemo(() => (user ? { id: user.id, name: user.name } : GUEST), [user]);
  const chat = useMessageWindow(transport, view.conversation, { me });
  // os buracos (kind fora de `parts`) tiram também os de humano no circuito que o painel já traz
  const renderers = useMemo(() => chatRenderers(def, agentUiRenderers) as UiRenderers, [def]);
  return (
    <ChatLanes
      key={view.conversation}
      def={def}
      chat={chat}
      transport={transport}
      me={me}
      panel={{
        title: view.title,
        onClose,
        suggestions: view.suggestions,
        uiRenderers: renderers,
        queue: view.queue,
        composer: view.placeholder === undefined ? undefined : { placeholder: view.placeholder },
        onTelemetry: telemetry,
        taskOf: agentTaskOf
      }}
    />
  );
}
