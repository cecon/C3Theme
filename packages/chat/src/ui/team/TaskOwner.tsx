import type { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Archive, ArrowSwapHorizontal, StopCircle } from 'iconsax-reactjs';

import { isBusy, type AgentState } from '../../core/agents';
import type { Author } from '../../core/types';
import { useChatText } from '../text';
import AuthorAvatar from './AuthorAvatar';
import AuthorLine from './AuthorLine';

export interface TaskOwnerProps {
  /** Quem responde pela tarefa agora (agente ou pessoa). */
  owner: Author;
  avatar?: ReactNode;
  state?: AgentState;
  /** A tarefa, em uma linha ("Pedido 1.204: 2 lasanhas para a Marina"). */
  task?: string;
  onReassign?: () => void;
  onStop?: () => void;
  onArchive?: () => void;
  animate?: boolean;
}

/**
 * Selo de quem é o dono da tarefa, no topo da conversa: avatar com o estado, nome e a tarefa, mais Reatribuir,
 * Parar e Arquivar (cada ação só aparece com o callback). Parar só faz sentido com o agente em movimento.
 */
export default function TaskOwner({ owner, avatar, state, task, onReassign, onStop, onArchive, animate }: TaskOwnerProps) {
  const t = useChatText();
  const busy = !!state && (isBusy(state) || state === 'waiting');
  return (
    <Stack
      component="section"
      aria-label={t('c3.chat.owner.label', { name: owner.name })}
      direction={{ xs: 'column', sm: 'row' }}
      spacing={{ xs: 1, sm: 1.5 }}
      sx={{
        alignItems: { xs: 'stretch', sm: 'center' },
        px: 2,
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
        <AuthorAvatar author={owner} avatar={avatar} state={state} size={36} animate={animate} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" component="p" sx={{ lineHeight: 1.2 }}>
            {t('c3.chat.owner')}
          </Typography>
          <AuthorLine author={owner} state={state} />
          {task && (
            <Typography variant="caption" color="text.secondary" component="p" noWrap title={task}>
              {task}
            </Typography>
          )}
        </Box>
      </Stack>
      <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, flexWrap: 'wrap', rowGap: 0.5 }}>
        {onReassign && (
          <Button size="small" color="secondary" startIcon={<ArrowSwapHorizontal size={16} />} onClick={onReassign}>
            {t('c3.chat.reassign')}
          </Button>
        )}
        {onStop && busy && (
          <Button size="small" color="error" startIcon={<StopCircle size={16} />} onClick={onStop}>
            {t('c3.chat.stopWork')}
          </Button>
        )}
        {onArchive && (
          <Button size="small" color="secondary" startIcon={<Archive size={16} />} onClick={onArchive}>
            {t('c3.chat.archive')}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
