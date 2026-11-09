// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useUiText } from '../i18n';

const LEVELS = ['error.main', 'warning.main', 'warning.main', 'success.main', 'success.dark'] as const;

/** Nota de 0 a 4: tamanho, minúsculas+maiúsculas, números e símbolos. */
export function passwordScore(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return Math.min(4, Math.max(0, score - 1));
}

/** Barra de força da senha para cadastro e troca de senha. */
export default function PasswordStrength({ password }: { password: string }) {
  const t = useUiText();
  if (!password) return null;
  const score = passwordScore(password);
  const color = LEVELS[score]!;
  const label = t(`c3.password.${score as 0 | 1 | 2 | 3 | 4}`);
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }} aria-live="polite">
      <Stack direction="row" spacing={0.5} sx={{ flex: 1 }}>
        {LEVELS.slice(1).map((_, i) => (
          <Box key={i} sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: i < score || (score === 0 && i === 0) ? color : 'divider' }} />
        ))}
      </Stack>
      <Typography variant="caption" sx={{ color, minWidth: 72, textAlign: 'end' }}>
        {label}
      </Typography>
    </Stack>
  );
}
