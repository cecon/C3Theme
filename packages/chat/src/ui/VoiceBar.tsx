// material-ui
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { keyframes } from '@mui/material/styles';

// third-party
import { Send2, Trash } from 'iconsax-reactjs';

import { SoftIconButton } from '@c3theme/ui';
import { clock } from './format';
import { useChatText } from './text';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: .3; }
`;

/** Barra enquanto grava: ponto vermelho, tempo, descartar e enviar. */
export default function VoiceBar({ elapsedMs, onCancel, onStop }: { elapsedMs: number; onCancel: () => void; onStop: () => void }) {
  const t = useChatText();
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: { xs: 1.5, sm: 2.5 }, py: 1.5 }}>
      <IconButton aria-label={t('c3.chat.cancelRecording')} onClick={onCancel} color="error">
        <Trash size={20} />
      </IconButton>
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          bgcolor: 'error.main',
          animation: `${pulse} 1.2s infinite`,
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
        }}
      />
      <Typography role="timer" sx={{ flex: 1, fontVariantNumeric: 'tabular-nums' }}>
        {t('c3.chat.recording', { time: clock(elapsedMs) })}
      </Typography>
      <SoftIconButton tone="primary" aria-label={t('c3.chat.stopRecording')} onClick={onStop} sx={{ width: 42, height: 42 }}>
        <Send2 size={20} variant="Bold" />
      </SoftIconButton>
    </Stack>
  );
}
