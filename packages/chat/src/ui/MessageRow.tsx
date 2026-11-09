import type { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

import type { AgentState } from '../core/agents';
import type { Handoff } from '../core/team';
import type { Author, Message } from '../core/types';
import AssistantMessage, { type AssistantMessageProps } from './AssistantMessage';
import { useDayFormat } from './format';
import MessageBubble, { type MessageBubbleProps } from './MessageBubble';
import type { ChatRow } from './rows';
import AuthorAvatar from './team/AuthorAvatar';
import AuthorLine from './team/AuthorLine';
import HandoffMarker from './team/HandoffMarker';

type AssistantPass = Pick<AssistantMessageProps, 'onOpenWorkspace' | 'onAnswer' | 'uiRenderers' | 'onAnswerUi'>;

export interface MessageRowProps extends Pick<MessageBubbleProps, 'renderText' | 'onRetry'>, AssistantPass {
  row: ChatRow;
  assistant: boolean;
  /** Último balão do bloco: é nele que vai o avatar, na conversa entre pessoas. */
  lastOfBlock: boolean;
  /** Última linha da lista: só nela aparece o "gerar de novo". */
  last: boolean;
  questionActive: boolean;
  /** Estado atual do autor, quando esta mensagem é do último bloco dele. */
  state?: AgentState;
  showAuthors?: boolean;
  renderAvatar?: (author: Author) => ReactNode;
  animate?: boolean;
  onRegenerate?: AssistantMessageProps['onRegenerate'];
  onOpenTask?: (handoff: Handoff, message: Message) => void;
}

/** Uma linha do histórico: separador de dia, passagem de tarefa, resposta de agente ou balão. */
export default function MessageRow(props: MessageRowProps) {
  const { row, assistant, state, showAuthors, renderAvatar, animate } = props;
  const day = useDayFormat();
  if (row.type === 'day') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
        <Chip
          size="small"
          variant="outlined"
          label={day.separator(row.iso)}
          sx={{ color: 'text.secondary', '&::first-letter': { textTransform: 'uppercase' } }}
        />
      </Box>
    );
  }
  const m = row.message;
  if (m.kind === 'handoff' && m.handoff) {
    const onOpenTask = props.onOpenTask;
    return <HandoffMarker handoff={m.handoff} renderAvatar={renderAvatar} onOpen={onOpenTask && ((h) => onOpenTask(h, m))} />;
  }
  const mine = m.direction === 'out';
  const avatar = (size: number) => (
    <AuthorAvatar author={m.author} avatar={renderAvatar?.(m.author)} state={state} size={size} animate={animate} />
  );
  // no assistente, quem chega é agente; numa conversa mista, gente (`kind: 'person'`) continua em balão
  if (assistant && !mine && m.kind !== 'system' && m.author.kind !== 'person') {
    const header = showAuthors && !row.grouped && (
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        {avatar(32)}
        <AuthorLine author={m.author} state={state} />
      </Stack>
    );
    return (
      <Box sx={{ pt: row.grouped ? 0.5 : 1.5, pb: 0.5 }}>
        <AssistantMessage
          message={m}
          header={header || undefined}
          renderText={props.renderText}
          onRegenerate={props.last ? props.onRegenerate : undefined}
          onOpenWorkspace={props.onOpenWorkspace}
          onAnswer={props.onAnswer}
          questionActive={props.questionActive}
          uiRenderers={props.uiRenderers}
          onAnswerUi={props.onAnswerUi}
        />
      </Box>
    );
  }
  const withAvatar = (renderAvatar || (assistant && showAuthors)) && !mine && m.kind !== 'system';
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: mine ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        gap: 1,
        pt: row.grouped ? 0.25 : 1
      }}
    >
      {withAvatar && <Box sx={{ width: 32, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>{props.lastOfBlock && avatar(32)}</Box>}
      <MessageBubble message={m} grouped={row.grouped} showAuthor={showAuthors} renderText={props.renderText} onRetry={props.onRetry} />
    </Box>
  );
}
