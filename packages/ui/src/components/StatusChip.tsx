// material-ui
import Chip from '@mui/material/Chip';

import { softColors, Tone } from '../theme/soft';

export type StatusTone = Exclude<Tone, 'secondary'>;

/** Selo de situação com fundo suave na cor do tom (ex.: "Ativo" verde, "Cancelado" vermelho). */
export default function StatusChip({
  label,
  tone = 'neutral',
  size = 'small'
}: {
  label: string;
  tone?: StatusTone;
  size?: 'small' | 'medium';
}) {
  return <Chip size={size} label={label} sx={(theme) => softColors(theme, tone)} />;
}
