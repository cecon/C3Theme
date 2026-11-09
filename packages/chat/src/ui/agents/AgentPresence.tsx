import type { ReactNode } from 'react';

// material-ui
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import { keyframes, type Theme } from '@mui/material/styles';

// third-party
import { Danger, Pause, TickCircle } from 'iconsax-reactjs';

import type { AgentState } from '../../core/agents';
import { fillAvatar } from './fill';

const spin = keyframes`to { transform: rotate(360deg); }`;
const pulse = keyframes`0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.08); opacity: .55; }`;
const breathe = keyframes`0%, 100% { box-shadow: 0 0 0 0 var(--ring); } 50% { box-shadow: 0 0 0 4px transparent; }`;

export interface AgentPresenceProps {
  avatar: ReactNode;
  state: AgentState;
  /** Pedidos esperando a pessoa: selo com o número no canto. */
  pending?: number;
  /** Diâmetro do anel, em px. O avatar fica 8 px menor. */
  size?: number;
  /** Movimento dos estados pensando, falando e trabalhando. Também para com `prefers-reduced-motion`. */
  animate?: boolean;
}

const RING: Record<AgentState, (t: Theme) => string> = {
  idle: (t) => t.vars.palette.divider,
  thinking: (t) => t.vars.palette.primary.main,
  talking: (t) => t.vars.palette.primary.main,
  working: (t) => t.vars.palette.primary.main,
  waiting: (t) => t.vars.palette.warning.main,
  paused: (t) => t.vars.palette.text.disabled,
  error: (t) => t.vars.palette.error.main,
  done: (t) => t.vars.palette.success.main
};

const MOTION: Partial<Record<AgentState, string>> = {
  thinking: `${pulse} 1.6s ease-in-out infinite`,
  talking: `${breathe} 1.2s ease-out infinite`,
  working: `${spin} 1s linear infinite`
};

/** Selo pequeno no pé do avatar para os estados que mudam o que a pessoa faz (pausado, erro, pronto). */
function StateMark({ state }: { state: AgentState }) {
  const mark = {
    paused: { Icon: Pause, color: 'text.secondary' },
    error: { Icon: Danger, color: 'error.main' },
    done: { Icon: TickCircle, color: 'success.main' }
  }[state as 'paused' | 'error' | 'done'];
  if (!mark) return null;
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        insetInlineEnd: -2,
        bottom: -2,
        display: 'grid',
        placeItems: 'center',
        width: 16,
        height: 16,
        borderRadius: '50%',
        bgcolor: 'background.paper',
        color: mark.color
      }}
    >
      <mark.Icon size={14} variant="Bold" />
    </Box>
  );
}

/**
 * Avatar do agente com o estado em volta: anel na cor do estado (que gira, pulsa ou respira enquanto ele trabalha)
 * e selo de pendência. É só desenho: o nome e o estado por extenso vão no rótulo de quem usa.
 */
export default function AgentPresence({ avatar, state, pending = 0, size = 44, animate = true }: AgentPresenceProps) {
  const motion = animate ? MOTION[state] : undefined;
  // tudo aqui é desenho: o nome, o estado e as pendências vão por extenso no rótulo do botão de quem usa
  return (
    <Box component="span" aria-hidden sx={{ display: 'inline-flex' }}>
      <Badge badgeContent={pending} color="error" max={9} overlap="circular" sx={{ '& .MuiBadge-badge': { fontWeight: 700 } }}>
        <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <Box
            sx={(theme) => ({
              '--ring': RING[state](theme),
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: 2,
              borderColor: 'var(--ring)',
              // trabalhando: arco que gira em vez do anel inteiro
              ...(state === 'working' && {
                borderColor: 'transparent',
                borderTopColor: 'var(--ring)',
                borderInlineEndColor: 'var(--ring)'
              }),
              ...(state === 'thinking' && { borderStyle: 'dashed' }),
              animation: motion,
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
            })}
          />
          <Box
            sx={{
              ...fillAvatar(size - 8),
              position: 'absolute',
              inset: 4,
              filter: state === 'paused' ? 'grayscale(1)' : undefined
            }}
          >
            {avatar}
          </Box>
          <StateMark state={state} />
        </Box>
      </Badge>
    </Box>
  );
}
