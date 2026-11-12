import { useMemo, useState, type ReactNode } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { CloseCircle, Magicpen } from 'iconsax-reactjs';

import type { Conversation, Message } from '../core/types';
import type { ChatTelemetryPort, TaskOf } from '../core/telemetry';
import useChatTelemetry from '../hooks/useChatTelemetry';
import useDraft from '../hooks/useDraft';
import useMessageQueue from '../hooks/useMessageQueue';
import type useMessageWindow from '../hooks/useMessageWindow';
import AgentComposer, { type AgentComposerProps } from './AgentComposer';
import VoiceConversation, { type VoiceConversationProps } from './voice/VoiceConversation';
import ConversationPicker from './ConversationPicker';
import MessageList from './MessageList';
import type { UiRenderers } from './UiParts';
import { shouldAnnounce, waitingFor } from '../core/waiting';
import { hitlUiRenderers, WaitingBanner } from './hitl';
import { useChatText } from './text';

/** O que o painel usa do `useMessageWindow`: passe o retorno inteiro. */
export type AssistantChat = Pick<
  ReturnType<typeof useMessageWindow>,
  'conversationId' | 'messages' | 'hasMore' | 'loading' | 'loadOlder' | 'send' | 'retry' | 'stop' | 'generating' | 'answer'
> &
  Partial<Pick<ReturnType<typeof useMessageWindow>, 'answerUi'>>;

export interface AssistantPanelProps {
  chat: AssistantChat;
  /** Padrão: "Assistente". */
  title?: ReactNode;
  /** Ícone ao lado do título. Padrão: varinha. */
  icon?: ReactNode;
  /** Botão de fechar no cabeçalho (painel lateral, gaveta). */
  onClose?: () => void;
  /** Botões extras no cabeçalho. */
  actions?: ReactNode;
  /** Histórico de conversas: com isso, aparece a caixa de troca. */
  conversations?: Conversation[];
  onSelectConversation?: (id: string) => void;
  onNewConversation?: () => void;
  /** Apagar a conversa: o painel pergunta antes. */
  onDeleteConversation?: (id: string) => void;
  /** Gerar de novo a última resposta (o app reenvia a pergunta ou chama o modelo de novo). */
  onRegenerate?: (message: Message) => void;
  /** Abrir o trabalho de uma resposta na área de trabalho (`AgentWorkspace`, ao lado do painel). */
  onOpenWorkspace?: (message: Message) => void;
  /** Perguntas prontas para a conversa vazia: clicar envia. */
  suggestions?: string[];
  /** Conversa vazia, no lugar do padrão ("Como posso ajudar?" e as sugestões). */
  empty?: ReactNode;
  /** Ajustes da caixa de mensagem: anexo, itens do +, seletores de modo e modelo, linha de status, placeholder. */
  composer?: Partial<Omit<AgentComposerProps, 'value' | 'onChange' | 'onSend' | 'busy' | 'onStop' | 'queue'>>;
  /**
   * Catálogo das partes de interface que o assistente pode pôr nas respostas (`kind` → componente), ex.: os
   * renderizadores do @c3theme/engine. As de human-in-the-loop (`c3.tool`, `c3.plan`, `c3.browser`) já vêm; as daqui
   * somam ou trocam. Sem renderizador, a parte aparece como "não sei mostrar".
   */
  uiRenderers?: UiRenderers;
  /**
   * Conversa por voz ao vivo: com isso, o painel troca a lista e a caixa pela `VoiceConversation` (bola, estado,
   * legenda, microfone e encerrar). O app liga ao tocar no botão de voz (`composer.idleAction`) e tira no `onEnd`.
   */
  voice?: VoiceConversationProps;
  /** Fila da próxima mensagem enquanto o assistente responde. Padrão: ligada. */
  queue?: boolean;
  /**
   * Eventos de tarefa das partes de interface (`task.start` ao aparecer, `task.done` ao gravar, `task.abandon` ao
   * recusar ou vencer), com `channel: 'chat'`. Precisa de `taskOf` (ex.: `agentTaskOf` do @c3theme/engine).
   */
  onTelemetry?: ChatTelemetryPort;
  /** Diz qual entidade e operação cada parte é; `null` não é tarefa. */
  taskOf?: TaskOf;
}

/**
 * Painel de assistente de IA pronto: cabeçalho, troca de conversa, respostas em markdown com streaming,
 * o trabalho do agente, perguntas e a caixa com fila, seletores e Parar. Ocupa a altura do pai: ponha numa gaveta ou coluna lateral.
 */
export default function AssistantPanel(props: AssistantPanelProps) {
  const { chat, title, icon, onClose, actions, conversations, suggestions = [], composer } = props;
  const t = useChatText();
  const draft = useDraft(chat.conversationId);
  useChatTelemetry(chat.conversationId, chat.messages, props.onTelemetry, props.taskOf);
  const [confirm, setConfirm] = useState<Conversation | null>(null);
  const renderers = useMemo(() => ({ ...hitlUiRenderers, ...props.uiRenderers }), [props.uiRenderers]);
  const waiting = waitingFor(chat.messages);
  const [jumpTo, setJumpTo] = useState<{ messageId: string; seq: number }>();
  const queue = useMessageQueue({
    generating: chat.generating,
    send: (text, files) => chat.send(text, { files }),
    conversationId: chat.conversationId
  });

  function send(text: string, files: File[] = []) {
    chat.send(text, { files });
    draft.clear();
  }

  function stop() {
    queue.pause(); // quem parou quer decidir: a fila espera
    chat.stop?.();
  }

  const empty = props.empty ?? (
    <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', mt: 6, px: 1 }}>
      <Typography variant="subtitle1">{t('c3.chat.assistantEmpty')}</Typography>
      {suggestions.length > 0 && (
        <Stack direction="row" sx={{ flexWrap: 'wrap', justifyContent: 'center', gap: 1 }}>
          {suggestions.map((s) => (
            <Chip key={s} label={s} variant="outlined" onClick={() => send(s)} sx={{ height: 'auto', py: 0.5, whiteSpace: 'normal' }} />
          ))}
        </Stack>
      )}
    </Stack>
  );

  return (
    <Stack sx={{ height: '100%', minHeight: 0, bgcolor: 'background.paper' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 2, py: 1.25, minHeight: 56 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flex: 1, minWidth: 0, color: 'primary.main' }}>
          {icon ?? <Magicpen size={20} variant="Bulk" />}
          <Typography variant="subtitle1" component="h2" noWrap sx={{ color: 'text.primary' }}>
            {title ?? t('c3.chat.assistant')}
          </Typography>
        </Stack>
        {actions}
        {onClose && (
          <Tooltip title={t('c3.chat.close')}>
            <IconButton aria-label={t('c3.chat.close')} onClick={onClose} edge="end">
              <CloseCircle size={20} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      <Divider />
      {conversations && props.onSelectConversation && (
        <Stack sx={{ px: 2, pt: 2, pb: 0.5 }}>
          <ConversationPicker
            conversations={conversations}
            selectedId={chat.conversationId}
            onSelect={props.onSelectConversation}
            onNew={props.onNewConversation}
            onDelete={props.onDeleteConversation && ((id) => setConfirm(conversations.find((c) => c.id === id) ?? null))}
          />
        </Stack>
      )}
      {props.voice ? (
        <VoiceConversation {...props.voice} />
      ) : (
        <>
          <Stack sx={{ flex: 1, minHeight: 0 }}>
            <MessageList
              variant="assistant"
              title={typeof title === 'string' ? title : t('c3.chat.assistant')}
              messages={chat.messages}
              hasMore={chat.hasMore}
              loadingOlder={chat.loading === 'older'}
              onLoadOlder={chat.loadOlder}
              onRetry={chat.retry}
              onRegenerate={props.onRegenerate}
              onOpenWorkspace={props.onOpenWorkspace}
              onAnswer={chat.answer && ((m, a) => void chat.answer!(m.id, a))}
              uiRenderers={renderers}
              jumpTo={jumpTo}
              onAnswerUi={chat.answerUi && ((m, partId, a) => chat.answerUi!(m.id, partId, a))}
              empty={empty}
            />
          </Stack>
          {shouldAnnounce(chat.messages, waiting) && (
            <WaitingBanner waiting={waiting} onGo={(id) => setJumpTo((j) => ({ messageId: id, seq: (j?.seq ?? 0) + 1 }))} />
          )}
          <AgentComposer
            hint={t('c3.chat.hint')}
            {...composer}
            value={draft.text}
            onChange={draft.setText}
            onSend={send}
            busy={chat.generating}
            onStop={chat.stop && stop}
            queue={props.queue === false ? undefined : queue}
          />
        </>
      )}
      <Dialog open={!!confirm} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogContent>
          <DialogContentText>{t('c3.chat.deleteConfirm', { title: confirm?.title ?? '' })}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setConfirm(null)}>
            {t('c3.chat.cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (confirm) props.onDeleteConversation?.(confirm.id);
              setConfirm(null);
            }}
          >
            {t('c3.chat.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
