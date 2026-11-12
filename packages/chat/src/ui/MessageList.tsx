import { useEffect, useMemo, useRef, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';

// third-party
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown } from 'iconsax-reactjs';

import { isPending } from '../core/question';
import type { Author, Message } from '../core/types';
import type { AgentState } from '../core/agents';
import { withLastDelivery } from '../core/delivery';
import { latestBlocks, stateFor } from '../core/team';
import type { AssistantMessageProps } from './AssistantMessage';
import type { MessageBubbleProps } from './MessageBubble';
import MessageRow, { type MessageRowProps } from './MessageRow';
import { buildRows, type ChatRow } from './rows';
import { useChatText } from './text';
import TypingIndicator from './TypingIndicator';
import useChatScroll from './useChatScroll';

export interface MessageListProps extends Pick<MessageBubbleProps, 'renderText' | 'onRetry' | 'onEditFailed' | 'onDiscard'> {
  messages: Message[];
  /** Resumo opcional da entrega externa da última resposta do agente. A entrega do turno prevalece. */
  entregaDaUltimaMensagem?: Message['entrega'];
  /**
   * `people` (padrão): conversa entre pessoas, tudo em balão. `assistant`: as respostas recebidas saem sem balão,
   * na largura toda, com ferramentas, "Pensando…", cursor de escrita, copiar e gerar de novo.
   */
  variant?: 'people' | 'assistant';
  /** Gerar de novo a última resposta do assistente. */
  onRegenerate?: AssistantMessageProps['onRegenerate'];
  /** Abrir o trabalho de uma resposta na área de trabalho (`AgentWorkspace`). */
  onOpenWorkspace?: AssistantMessageProps['onOpenWorkspace'];
  /** Responder a pergunta de uma resposta do assistente. */
  onAnswer?: AssistantMessageProps['onAnswer'];
  /** Catálogo de partes de interface (`message.ui`) e como respondê-las. */
  uiRenderers?: AssistantMessageProps['uiRenderers'];
  onAnswerUi?: AssistantMessageProps['onAnswerUi'];
  /** Ações por mensagem (menu "Mais ações"), filtradas pelo `when` de cada uma, ex.: "Ramificar daqui". */
  messageActions?: AssistantMessageProps['messageActions'];
  onMessageAction?: AssistantMessageProps['onMessageAction'];
  /** Nome da conversa, para o leitor de tela ("Mensagens de Ana"). */
  title: string;
  hasMore?: boolean;
  loadingOlder?: boolean;
  /** Pedido do histórico anterior, ao chegar perto do topo. */
  onLoadOlder?: () => void;
  typing?: Author[];
  /**
   * Conversa em grupo: nome do autor no primeiro balão de cada bloco. No `variant="assistant"`, cada agente ganha a
   * linha de cima com avatar e nome (conversa com vários agentes).
   */
  showAuthors?: boolean;
  /**
   * Desenho do avatar de cada autor (peça, foto, ícone). Na conversa entre pessoas, liga a coluna de avatar ao lado
   * das recebidas (só no último balão do bloco). Sem isso, iniciais ou `avatarUrl`.
   */
  renderAvatar?: (author: Author) => ReactNode;
  /**
   * Estado atual de cada agente, por id do autor: anel no avatar e o estado por extenso ao lado do nome, só no último
   * bloco daquele agente (o estado de agora não vale para as mensagens antigas).
   */
  agentStates?: Readonly<Record<string, AgentState>>;
  /** Movimento do anel de estado. Também para com `prefers-reduced-motion`. */
  animate?: boolean;
  /** Abre a tarefa de uma passagem (`kind: 'handoff'` com `taskId`). Sem isso, o marcador só mostra. */
  onOpenTask?: MessageRowProps['onOpenTask'];
  /** Conversa sem mensagens. */
  empty?: ReactNode;
  /** Rola até a mensagem (aviso "esperando você"). `seq` novo rola de novo, mesmo para a mesma mensagem. */
  jumpTo?: { messageId: string; seq: number };
}

/**
 * Histórico virtualizado: só as linhas visíveis vão para o DOM, então milhares de mensagens não pesam. Ocupa a
 * altura do pai (que precisa ter altura definida).
 */
export default function MessageList(props: MessageListProps) {
  const {
    messages: source,
    title,
    hasMore = false,
    loadingOlder = false,
    onLoadOlder,
    typing = [],
    showAuthors,
    renderAvatar,
    empty
  } = props;
  const messages = useMemo(() => withLastDelivery(source, props.entregaDaUltimaMensagem), [source, props.entregaDaUltimaMensagem]);
  const assistant = props.variant === 'assistant';
  // só a última pergunta em aberto atende o Ctrl+Enter de qualquer lugar
  const activeQuestionId = useMemo(() => messages.findLast((m) => isPending(m.question))?.id, [messages]);
  const t = useChatText();
  const rows = useMemo(() => buildRows(messages), [messages]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => (rows[i].type === 'day' ? 44 : 64),
    getItemKey: (i) => rows[i].key,
    overscan: 8
  });
  const { onScroll, unseen, toEnd } = useChatScroll({
    rows,
    virtualizer,
    scrollRef,
    hasMore,
    loadingOlder,
    onLoadOlder,
    typingCount: typing.length
  });

  const jump = props.jumpTo;
  useEffect(() => {
    if (!jump) return;
    const index = rows.findIndex((r) => r.type === 'message' && r.message.id === jump.messageId);
    if (index >= 0) virtualizer.scrollToIndex(index, { align: 'center' });
    // só quando pedem de novo (seq), não a cada linha nova
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jump?.seq]);

  // o avatar vai no último balão do bloco: o seguinte não continua o bloco
  const lastOfBlock = (i: number) => {
    const next = rows[i + 1];
    return !(next?.type === 'message' && next.grouped);
  };

  const states = props.agentStates;
  const latest = useMemo(() => (states ? latestBlocks(messages) : undefined), [messages, states]);
  const renderRow = (row: ChatRow, i: number) => (
    <MessageRow
      row={row}
      assistant={assistant}
      lastOfBlock={lastOfBlock(i)}
      last={i === rows.length - 1}
      questionActive={row.type === 'message' && row.message.id === activeQuestionId}
      state={row.type === 'message' && latest ? stateFor(row.message, states, latest) : undefined}
      showAuthors={showAuthors}
      renderAvatar={renderAvatar}
      animate={props.animate}
      renderText={props.renderText}
      onRetry={props.onRetry}
      onEditFailed={props.onEditFailed}
      onDiscard={props.onDiscard}
      onRegenerate={props.onRegenerate}
      onOpenWorkspace={props.onOpenWorkspace}
      onAnswer={props.onAnswer}
      uiRenderers={props.uiRenderers}
      onAnswerUi={props.onAnswerUi}
      onOpenTask={props.onOpenTask}
      messageActions={props.messageActions}
      onMessageAction={props.onMessageAction}
    />
  );

  return (
    <Box sx={{ position: 'relative', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {loadingOlder && (
        <LinearProgress
          aria-label={t('c3.chat.loadingOlder')}
          sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 'floating' }}
        />
      )}
      <Box
        ref={scrollRef}
        onScroll={onScroll}
        role="log"
        aria-label={t('c3.chat.log', { title })}
        tabIndex={0}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowAnchor: 'none',
          px: assistant ? 2 : { xs: 1.5, sm: 3 },
          py: 2,
          outline: 'none'
        }}
      >
        {rows.length === 0 && !loadingOlder ? (
          (empty ?? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 6 }}>
              {t('c3.chat.empty')}
            </Typography>
          ))
        ) : (
          <>
            {!hasMore && !assistant && rows.length > 0 && (
              <Typography variant="caption" color="text.secondary" component="p" sx={{ textAlign: 'center', pb: 1 }}>
                {t('c3.chat.beginning')}
              </Typography>
            )}
            <Box sx={{ position: 'relative', height: virtualizer.getTotalSize() }}>
              {virtualizer.getVirtualItems().map((v) => (
                <Box
                  key={v.key}
                  data-index={v.index}
                  ref={virtualizer.measureElement}
                  sx={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${v.start}px)` }}
                >
                  {renderRow(rows[v.index], v.index)}
                </Box>
              ))}
            </Box>
          </>
        )}
        <TypingIndicator authors={typing} />
      </Box>
      {unseen > 0 && (
        <Button
          variant="contained"
          size="small"
          onClick={toEnd}
          startIcon={<ArrowDown size={16} />}
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 'floating',
            borderRadius: 4,
            boxShadow: 4
          }}
        >
          {t('c3.chat.newMessages')} ({unseen})
        </Button>
      )}
    </Box>
  );
}
