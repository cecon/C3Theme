import type { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { CloseCircle, Lamp, Monitor } from 'iconsax-reactjs';

import { EmptyState } from '@c3theme/ui';
import type { Message } from '../core/types';
import ActivityTrace from './ActivityTrace';
import { useChatText } from './text';
import useWorkTime, { isWorking } from './useWorkTime';

export interface AgentWorkspaceProps {
  /** A resposta do assistente cujo trabalho aparece aqui (normalmente a última). Sem ela, fica o aviso de vazio. */
  message?: Message;
  /** A pergunta que gerou esse trabalho, em cima, para dar contexto. */
  question?: string;
  /** Padrão: "Área de trabalho". */
  title?: ReactNode;
  onClose?: () => void;
}

/**
 * Área de trabalho do agente: o raciocínio e as etapas da resposta, abertos e com espaço, para acompanhar o
 * assistente trabalhando ao vivo ou conferir depois o que ele consultou. Ocupa a altura do pai; fica bem numa
 * coluna ao lado do `AssistantPanel` (ou numa gaveta no celular).
 */
export default function AgentWorkspace({ message, question, title, onClose }: AgentWorkspaceProps) {
  const t = useChatText();
  const workTime = useWorkTime(message ?? EMPTY);
  const working = !!message && isWorking(message);
  const hasActivity = !!message && (working || !!message.reasoning || !!message.tools?.length);

  return (
    <Stack sx={{ height: '100%', minHeight: 0, bgcolor: 'background.paper' }} aria-label={t('c3.chat.workspace')} component="section">
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 2, py: 1.25, minHeight: 56 }}>
        <Box sx={{ display: 'flex', color: 'primary.main' }}>
          <Monitor size={20} variant="Bulk" />
        </Box>
        <Typography variant="subtitle1" component="h2" noWrap sx={{ flex: 1, minWidth: 0 }}>
          {title ?? t('c3.chat.workspace')}
        </Typography>
        {hasActivity && (
          <Chip
            size="small"
            color={message.streaming ? 'primary' : 'success'}
            variant={message.streaming ? 'filled' : 'outlined'}
            label={t(working ? 'c3.chat.working' : message.streaming ? 'c3.chat.answering' : 'c3.chat.finished')}
          />
        )}
        {onClose && (
          <Tooltip title={t('c3.chat.close')}>
            <IconButton aria-label={t('c3.chat.close')} onClick={onClose} edge="end">
              <CloseCircle size={20} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      <Divider />
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 2.5, py: 2 }} aria-live="polite">
        {hasActivity ? (
          <Stack spacing={2}>
            {question && (
              <Typography variant="body2" sx={{ fontWeight: 500, p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                {question}
              </Typography>
            )}
            <ActivityTrace message={message} workTime={workTime} variant="panel" />
          </Stack>
        ) : (
          <EmptyState dense icon={<Lamp size={22} />} title={t('c3.chat.workspaceEmpty')} />
        )}
      </Box>
    </Stack>
  );
}

const EMPTY: Message = { id: '', conversationId: '', author: { id: '', name: '' }, direction: 'in', createdAt: '' };
