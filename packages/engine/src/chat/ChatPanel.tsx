// O assistente montado pela spec (`$defs/chat`, ADR 0006): o AssistantPanel do @c3theme/chat sobre o transporte do
// cliente do motor (`client.chat`), com as partes do motor e a telemetria da shell. Nenhum TS do sistema.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { CloseCircle, Magicpen } from 'iconsax-reactjs';

import { useChatText, useMessageWindow, type AssistantChat, type Author, type ChatTransport, type UiRenderers } from '@c3theme/chat';

import { agentTaskOf, agentUiRenderers } from '../agent';
import { ApiError } from '../apiError';
import { useAuthSession } from '../auth/session';
import { useEngine, useText } from '../context';
import StateView from '../states/StateView';
import useOnline from '../states/useOnline';
import { chatRenderers, chatView, type ChatDef, type ChatView } from './chatDef';
import { chatStates, watchFailures, type ChatFailure } from './chatStates';
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
  const [failure, setFailure] = useState<ChatFailure>(null);
  // `opened` remonta a conversa: "Tentar de novo" carrega o histórico outra vez
  const [opened, setOpened] = useState(0);
  const watched = !!def.states;
  const transport = useMemo(() => {
    const base = client.chat && watchMissing(client.chat, () => setMissing(true));
    return base && watched ? watchFailures(base, setFailure) : base;
  }, [client.chat, watched]);
  const view = chatView(def, text);
  if (!transport || missing)
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">Este sistema não tem assistente.</Alert>
      </Box>
    );
  const reload = () => {
    setFailure(null);
    setOpened((n) => n + 1);
  };
  return (
    <Conversation
      key={opened}
      transport={transport}
      view={view}
      def={def}
      onClose={onClose}
      failure={failure}
      onReload={reload}
      onClear={() => setFailure(null)}
    />
  );
}

interface ConversationProps {
  transport: ChatTransport;
  view: ChatView;
  def: ChatDef;
  onClose?: () => void;
  failure: ChatFailure;
  /** Sem histórico: abre a conversa de novo. */
  onReload: () => void;
  onClear: () => void;
}

function Conversation({ transport, view, def, onClose, failure, onReload, onClear }: ConversationProps) {
  const { telemetry } = useEngine();
  const user = useAuthSession()?.user;
  const me = useMemo(() => (user ? { id: user.id, name: user.name } : GUEST), [user]);
  const chat = useMessageWindow(transport, view.conversation, { me });
  const online = useOnline();
  // a rede voltou depois de uma abertura sem rede: abre de novo sozinho
  const wasOnline = useRef(online);
  useEffect(() => {
    if (online && !wasOnline.current && failure === 'offline') onReload();
    wasOnline.current = online;
  }, [online, failure, onReload]);
  const t = useChatText();
  // os buracos (kind fora de `parts`) tiram também os de humano no circuito que o painel já traz
  const renderers = useMemo(() => chatRenderers(def, agentUiRenderers) as UiRenderers, [def]);
  const states = def.states;
  const shown = chatStates(states, { loading: chat.loading === 'initial', failure, online, count: chat.messages.length });
  if (states && shown.cover)
    return (
      <Stack sx={{ height: '100%' }}>
        <Stack direction="row" sx={{ alignItems: 'center', px: 2, py: 1.25, minHeight: 56, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flex: 1, minWidth: 0, color: 'primary.main' }}>
            <Magicpen size={20} variant="Bulk" />
            <Typography variant="subtitle1" component="h2" noWrap sx={{ color: 'text.primary' }}>
              {view.title}
            </Typography>
          </Stack>
          {onClose && (
            <IconButton aria-label={t('c3.chat.close')} onClick={onClose} edge="end">
              <CloseCircle size={20} />
            </IconButton>
          )}
        </Stack>
        <StateView states={states} state={shown.cover} />
      </Stack>
    );
  // com histórico, tentar de novo não descarta nada: reenvia o que falhou ou busca a página que não veio
  const retry = () => {
    onClear();
    const failed = chat.messages.filter((m) => m.status === 'failed' && m.clientId);
    if (failed.length === 0) void chat.loadOlder();
    for (const m of failed) chat.retry(m.clientId!);
  };
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
        steer: view.steer,
        entregaDaUltimaMensagem: def.entregaDaUltimaMensagem,
        composer: { sendKey: view.sendKey, ...(view.placeholder !== undefined && { placeholder: view.placeholder }) },
        onTelemetry: telemetry,
        taskOf: agentTaskOf,
        ...(states && shown.banner && { banner: <StateView states={states} state={shown.banner} onRetry={retry} banner /> }),
        ...(states &&
          shown.slot && {
            empty: (
              <Slot
                chat={chat}
                view={view}
                empty={shown.slot === 'empty'}
                slot={<StateView states={states} state={shown.slot} onRetry={onReload} dense />}
              />
            )
          })
      }}
    />
  );
}

/** A conversa vazia declarada: o estado e, só no vazio, as perguntas prontas que enviam. */
function Slot({ chat, view, slot, empty }: { chat: AssistantChat; view: ChatView; slot: ReactNode; empty: boolean }) {
  return (
    <Stack sx={{ alignItems: 'center', mt: 4 }}>
      {slot}
      {empty && view.suggestions.length > 0 && (
        <Stack direction="row" sx={{ flexWrap: 'wrap', justifyContent: 'center', gap: 1, px: 1 }}>
          {view.suggestions.map((s) => (
            <Chip
              key={s}
              label={s}
              variant="outlined"
              onClick={() => chat.send(s)}
              sx={{ height: 'auto', py: 0.5, whiteSpace: 'normal' }}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
