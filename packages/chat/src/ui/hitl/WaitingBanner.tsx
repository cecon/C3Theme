// material-ui
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Clock } from 'iconsax-reactjs';

import type { Waiting } from '../../core/waiting';
import { useChatText } from '../text';
import { spacerSx } from './sx';

export interface WaitingBannerProps {
  waiting: Waiting;
  /** Leva a lista até a pendência. */
  onGo: (messageId: string) => void;
}

/**
 * "O assistente espera você": aparece acima da caixa quando uma pergunta ou um pedido de aprovação ficou para trás
 * na conversa, para ninguém digitar sem ver que o agente está parado esperando.
 */
export default function WaitingBanner({ waiting, onGo }: WaitingBannerProps) {
  const t = useChatText();
  return (
    <Stack
      role="status"
      direction="row"
      spacing={1}
      sx={{
        alignItems: 'center',
        mx: 2,
        mb: 1,
        px: 1.5,
        py: 0.5,
        borderRadius: 2,
        bgcolor: (th) => alpha(th.palette.warning.main, 0.12),
        border: 1,
        borderColor: (th) => alpha(th.palette.warning.main, 0.4)
      }}
    >
      <Stack sx={{ color: 'warning.main' }} aria-hidden>
        <Clock size={16} color="currentColor" />
      </Stack>
      <Typography variant="body2" sx={spacerSx}>
        {t('c3.chat.waiting', { count: waiting.count })}
      </Typography>
      <Button size="small" color="inherit" onClick={() => onGo(waiting.messageId)}>
        {t('c3.chat.waiting.go')}
      </Button>
    </Stack>
  );
}
