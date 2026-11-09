import type { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';

import { SoftAvatar } from '@c3theme/ui';

import type { AgentState } from '../../core/agents';
import type { Author } from '../../core/types';
import AgentPresence from '../agents/AgentPresence';
import { initials } from '../ConversationList';

export interface AuthorAvatarProps {
  author: Author;
  /** O desenho do avatar (o app escolhe: peça, foto, ícone). Sem isso, iniciais ou `avatarUrl`. */
  avatar?: ReactNode;
  /** Estado atual do agente: anel em volta (gira, pulsa, respira). Sem isso, só o avatar. */
  state?: AgentState;
  size?: number;
  animate?: boolean;
}

/**
 * Avatar de quem escreveu, com o estado do agente em volta quando há. Ocupa sempre o mesmo espaço, com ou sem
 * estado, para a linha não pular quando o agente muda. É só desenho: o nome vai ao lado, por extenso.
 */
export default function AuthorAvatar({ author, avatar, state, size = 32, animate }: AuthorAvatarProps) {
  // o desenho do app (SoftAvatar, foto) preenche o círculo, com a letra no tamanho do círculo
  const fit = {
    display: 'grid',
    width: '100%',
    height: '100%',
    '& > *, & .MuiAvatar-root': { width: '100%', height: '100%', fontSize: Math.round((size - 8) * 0.4) }
  };
  const art = (
    <Box component="span" sx={fit}>
      {avatar ?? <SoftAvatar src={author.avatarUrl}>{initials(author.name)}</SoftAvatar>}
    </Box>
  );
  if (state) return <AgentPresence avatar={art} state={state} size={size} animate={animate} />;
  return (
    <Box component="span" aria-hidden sx={{ display: 'inline-grid', width: size, height: size, p: '4px', flexShrink: 0 }}>
      <Box sx={{ borderRadius: '50%', overflow: 'hidden', display: 'grid' }}>{art}</Box>
    </Box>
  );
}
