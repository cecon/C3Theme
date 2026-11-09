import type { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowRight } from 'iconsax-reactjs';

import type { Handoff } from '../../core/team';
import type { Author } from '../../core/types';
import { useChatText } from '../text';
import AuthorAvatar from './AuthorAvatar';

export interface HandoffMarkerProps {
  handoff: Handoff;
  /** Desenho do avatar de cada agente (o mesmo `renderAvatar` da lista). */
  renderAvatar?: (author: Author) => ReactNode;
  /** Abre a tarefa. Sem isso (ou sem `taskId`), o marcador só mostra. */
  onOpen?: (handoff: Handoff) => void;
}

/**
 * Linha no meio da conversa quando um agente passa tarefa para outro: os dois avatares com a seta e "Atendente passou
 * para Cozinha: confirmar 2 lasanhas". Com `taskId` e `onOpen`, é um botão que abre a tarefa.
 */
export default function HandoffMarker({ handoff: h, renderAvatar, onOpen }: HandoffMarkerProps) {
  const t = useChatText();
  const label = t('c3.chat.handoff', { from: h.from.name, to: h.to.name, task: h.task });
  const content = (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 1.25, py: 0.5, minWidth: 0 }}>
      <Stack direction="row" aria-hidden sx={{ alignItems: 'center', flexShrink: 0, color: 'text.secondary' }}>
        <AuthorAvatar author={h.from} avatar={renderAvatar?.(h.from)} size={24} />
        <ArrowRight size={14} />
        <AuthorAvatar author={h.to} avatar={renderAvatar?.(h.to)} size={24} />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'start', overflowWrap: 'anywhere' }}>
        {label}
      </Typography>
    </Stack>
  );
  const open = h.taskId && onOpen ? () => onOpen(h) : undefined;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1,
        '&::before, &::after': { content: '""', flex: 1, borderTop: 1, borderColor: 'divider' }
      }}
    >
      <Box
        component={open ? ButtonBase : 'div'}
        onClick={open}
        sx={{
          maxWidth: { xs: '90%', sm: '70%' },
          borderRadius: 4,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          ...(open && { '&:hover': { bgcolor: 'action.hover' }, '&.Mui-focusVisible': { outline: 2, outlineColor: 'primary.main' } })
        }}
      >
        {content}
      </Box>
    </Box>
  );
}
