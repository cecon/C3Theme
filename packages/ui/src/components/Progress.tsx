// material-ui
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useUiText } from '../i18n';

type Color = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

/** Barra de progresso com o percentual ao lado (e um rótulo opcional acima). */
export function LinearWithLabel({ value, label, color = 'primary' }: { value: number; label?: string; color?: Color }) {
  const t = useUiText();
  return (
    <Box>
      {label && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
      )}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <LinearProgress
          variant="determinate"
          value={value}
          color={color}
          sx={{ flex: 1, height: 6, borderRadius: 3 }}
          aria-label={label ?? t('c3.progress')}
        />
        <Typography variant="body2" sx={{ minWidth: 36, textAlign: 'end' }}>
          {Math.round(value)}%
        </Typography>
      </Stack>
    </Box>
  );
}

/** Anel de progresso com o percentual no centro e trilha de fundo. */
export function CircularWithLabel({ value, size = 56, color = 'primary' }: { value: number; size?: number; color?: Color }) {
  const t = useUiText();
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', width: size, height: size }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        thickness={4}
        aria-hidden
        sx={{ color: 'action.hover', position: 'absolute' }}
      />
      <CircularProgress variant="determinate" value={value} size={size} thickness={4} color={color} aria-label={t('c3.progress')} />
      <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {Math.round(value)}%
        </Typography>
      </Box>
    </Box>
  );
}
