// material-ui
import Chip from '@mui/material/Chip';

import { softColors, Tone } from '../theme/soft';
import { accentColors, type AccentColor } from '../theme/accents';

export type StatusTone = Exclude<Tone, 'secondary'>;

/** Selo de situação com fundo suave na cor do tom (ex.: "Ativo" verde, "Cancelado" vermelho). */
export default function StatusChip({
  label,
  tone = 'neutral',
  color,
  size = 'small'
}: {
  label: string;
  tone?: StatusTone;
  color?: AccentColor;
  size?: 'small' | 'medium';
}) {
  return <Chip size={size} label={label} sx={(theme) => accentColors(theme, color) ?? softColors(theme, tone)} />;
}
