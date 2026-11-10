// material-ui
import Box from '@mui/material/Box';
import { keyframes } from '@mui/material/styles';

import type { VoiceState } from './types';

const breathe = keyframes`
  0%, 100% { transform: scale(0.94); }
  50% { transform: scale(1.04); }
`;
const spin = keyframes`
  to { transform: rotate(360deg); }
`;

/**
 * A bola da conversa por voz: respira enquanto conecta ou pensa e cresce com o volume (`level`, 0 a 1) quando o
 * usuário fala ou o assistente responde. Com movimento reduzido, fica parada.
 */
export default function VoiceOrb({ state, level = 0, size = 168 }: { state: VoiceState; level?: number; size?: number }) {
  const live = state === 'listening' || state === 'speaking';
  const waiting = state === 'connecting' || state === 'thinking';
  return (
    <Box aria-hidden sx={{ width: size, height: size, position: 'relative', display: 'grid', placeItems: 'center' }}>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: (th) =>
            state === 'error'
              ? th.vars.palette.action.disabledBackground
              : `radial-gradient(circle at 35% 30%, ${th.vars.palette.info.light}, ${th.vars.palette.primary.main} 60%, ${th.vars.palette.primary.dark})`,
          opacity: state === 'error' ? 0.6 : 1,
          transform: live ? `scale(${0.92 + Math.min(1, level) * 0.22})` : undefined,
          transition: 'transform 90ms linear, background 300ms',
          animation: waiting ? `${breathe} 1.8s ease-in-out infinite` : undefined,
          boxShadow: live ? (th) => `0 0 ${24 + level * 48}px ${th.vars.palette.primary.main}55` : undefined,
          '@media (prefers-reduced-motion: reduce)': { animation: 'none', transform: 'none', transition: 'none' }
        }}
      />
      {state === 'thinking' && (
        <Box
          sx={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            border: 2,
            borderColor: 'primary.light',
            borderTopColor: 'transparent',
            animation: `${spin} 1.4s linear infinite`,
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
          }}
        />
      )}
    </Box>
  );
}
