// material-ui
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';

import { useChatText } from '../text';

/**
 * O anel do contexto na barra da caixa (variante split): quanto da janela de contexto a conversa já usou (0 a 100).
 * Passa de 80, fica amarelo; de 95, vermelho. O número completo fica na dica.
 */
export default function ContextRing({ used, size = 18 }: { used: number; size?: number }) {
  const t = useChatText();
  const value = Math.max(0, Math.min(100, Math.round(used)));
  const color = value >= 95 ? 'error' : value >= 80 ? 'warning' : 'inherit';
  const label = t('c3.chat.contextRing', { value });
  return (
    <Tooltip title={label}>
      <Box role="img" aria-label={label} sx={{ position: 'relative', display: 'inline-flex', color: 'text.secondary', mx: 0.5 }}>
        <CircularProgress
          aria-hidden
          variant="determinate"
          value={100}
          size={size}
          thickness={5}
          sx={{ color: 'action.disabledBackground', position: 'absolute' }}
        />
        <CircularProgress aria-hidden variant="determinate" value={value} size={size} thickness={5} color={color} />
      </Box>
    </Tooltip>
  );
}
