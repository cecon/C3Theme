import { useState, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { keyframes } from '@mui/material/styles';

// third-party
import { Copy, CopySuccess, Refresh2 } from 'iconsax-reactjs';

import type { QuestionAnswer } from '../core/question';
import type { Message } from '../core/types';
import type { MessageActionsMenuProps } from './lanes/MessageActionsMenu';
import MessageActionsMenu from './lanes/MessageActionsMenu';
import ActivityTrace from './ActivityTrace';
import AttachmentView from './AttachmentView';
import { useTimeFormat } from './format';
import Markdown from './Markdown';
import type { MessageBubbleProps } from './MessageBubble';
import QuestionCard from './QuestionCard';
import UiParts, { type UiPartsProps, type UiRenderers } from './UiParts';
import { useChatText } from './text';
import useWorkTime from './useWorkTime';
import DeliveryMark from './DeliveryMark';

const blink = keyframes`50% { opacity: 0; }`;

export interface AssistantMessageProps extends Pick<MessageBubbleProps, 'renderText'> {
  message: Message;
  /** Gerar de novo: só aparece na última resposta, quando ela já terminou. */
  onRegenerate?: (message: Message) => void;
  /** Abre o trabalho desta resposta na área de trabalho (`AgentWorkspace`). Sem isso, o botão não aparece. */
  onOpenWorkspace?: (message: Message) => void;
  /** Responder a pergunta da mensagem (`message.question`). Sem isso, o card só mostra. */
  onAnswer?: (message: Message, answer: QuestionAnswer) => void;
  /** Esta é a pergunta em aberto da conversa: o Ctrl+Enter responde de qualquer lugar. */
  questionActive?: boolean;
  /** Renderizadores das partes de interface (`message.ui`) por `kind`. */
  uiRenderers?: UiRenderers;
  /** Responder uma parte de interface. Sem isso, as partes só mostram. */
  onAnswerUi?: UiPartsProps['onAnswer'];
  /** Linha de cima com avatar e nome do agente (conversa com vários agentes). Sem isso, a resposta não diz quem é. */
  header?: ReactNode;
  /** Ações do menu "Mais ações" no rodapé da resposta ("Ramificar daqui"). */
  messageActions?: MessageActionsMenuProps['actions'];
  onMessageAction?: MessageActionsMenuProps['onAction'];
}

/**
 * Resposta do assistente: sem balão, na largura toda (cabe tabela e código). Em cima, o trabalho ("Pensando…" com o
 * raciocínio e as etapas ao vivo, que recolhe para "Pensou por 4 s" quando a resposta começa); depois o texto com
 * cursor piscando enquanto escreve e, no fim, copiar e gerar de novo. Com `question`, o texto vira o contexto de um
 * card de pergunta com as opções.
 */
export default function AssistantMessage(props: AssistantMessageProps) {
  const { message: m, onRegenerate, onOpenWorkspace, onAnswer, questionActive, renderText, uiRenderers, onAnswerUi, header } = props;
  const t = useChatText();
  const time = useTimeFormat();
  const [copied, setCopied] = useState(false);
  const workTime = useWorkTime(m);

  const body = m.text && (
    <Box
      sx={{
        width: '100%',
        color: 'text.primary',
        overflowWrap: 'anywhere',
        ...(m.streaming && {
          // cursor no fim do último bloco enquanto a resposta chega
          '& > :last-child > :last-child::after, & > p:last-child::after': {
            content: '"▍"',
            ml: 0.25,
            color: 'primary.main',
            animation: `${blink} 1s steps(1) infinite`,
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
          }
        })
      }}
    >
      {renderText ? (
        renderText(m.text, m)
      ) : m.format === 'markdown' ? (
        <Markdown text={m.text} />
      ) : (
        <Typography variant="body2" component="p" sx={{ whiteSpace: 'pre-wrap' }}>
          {m.text}
        </Typography>
      )}
    </Box>
  );

  function copy() {
    void navigator.clipboard?.writeText(m.text ?? '').then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <Stack spacing={0.75} sx={{ width: '100%', minWidth: 0, alignItems: 'flex-start' }} aria-busy={m.streaming || undefined}>
      {header}
      <ActivityTrace message={m} workTime={workTime} onOpenWorkspace={onOpenWorkspace && (() => onOpenWorkspace(m))} />
      {m.question && !m.streaming ? (
        <QuestionCard
          question={m.question}
          agentName={m.author.name}
          active={questionActive}
          onAnswer={onAnswer && ((a) => onAnswer(m, a))}
        >
          {body}
        </QuestionCard>
      ) : (
        body
      )}
      {!m.streaming && <UiParts message={m} renderers={uiRenderers} onAnswer={onAnswerUi} />}
      {m.attachments?.map((a) => (
        <AttachmentView key={a.id} attachment={a} />
      ))}
      {!m.streaming && (
        <Stack
          direction="row"
          spacing={0.25}
          useFlexGap
          sx={{ alignItems: 'center', color: 'text.secondary', ml: -0.75, flexWrap: 'wrap', rowGap: 0.5, maxWidth: '100%' }}
        >
          {m.text && (
            <Tooltip title={copied ? t('c3.chat.copied') : t('c3.chat.copy')}>
              <IconButton size="small" color="inherit" aria-label={t('c3.chat.copy')} onClick={copy}>
                {copied ? <CopySuccess size={16} /> : <Copy size={16} />}
              </IconButton>
            </Tooltip>
          )}
          {onRegenerate && (
            <Tooltip title={t('c3.chat.regenerate')}>
              <IconButton size="small" color="inherit" aria-label={t('c3.chat.regenerate')} onClick={() => onRegenerate(m)}>
                <Refresh2 size={16} />
              </IconButton>
            </Tooltip>
          )}
          <MessageActionsMenu message={m} actions={props.messageActions} onAction={props.onMessageAction} />
          <Typography variant="caption" component="time" dateTime={m.createdAt} sx={{ pl: 0.5, color: 'inherit' }}>
            {time(m.createdAt)}
          </Typography>
          {m.entrega && <DeliveryMark delivery={m.entrega} />}
        </Stack>
      )}
    </Stack>
  );
}
