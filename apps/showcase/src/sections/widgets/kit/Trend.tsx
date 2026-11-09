// material-ui
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowDown, ArrowUp } from 'iconsax-reactjs';

import { softColors } from '@c3theme/ui';
import { formatPercent } from './format';

interface TrendProps {
  /** Variação em %, positiva ou negativa. */
  value: number;
  /** `text`: seta + número; `chip`: selo com fundo suave. */
  look?: 'text' | 'chip';
  /** Quando cair é bom (ex.: taxa de rejeição), inverte as cores. */
  invert?: boolean;
}

/** Variação de um indicador: seta para cima/baixo, verde quando bom e vermelho quando ruim. */
export default function Trend({ value, look = 'text', invert = false }: TrendProps) {
  const up = value >= 0;
  const good = invert ? !up : up;
  const Icon = up ? ArrowUp : ArrowDown;
  const icon = <Icon size={14} style={{ transform: `rotate(${up ? 45 : -45}deg)` }} />;
  const label = `${up ? '+' : '−'}${formatPercent(Math.abs(value))}`;
  const description = `${up ? 'Alta' : 'Queda'} de ${formatPercent(Math.abs(value))}`;

  if (look === 'chip') {
    return (
      <Chip
        size="small"
        icon={icon}
        label={label}
        aria-label={description}
        sx={(theme) => ({ ...softColors(theme, good ? 'success' : 'danger'), '& .MuiChip-icon': { color: 'inherit' }, fontWeight: 600 })}
      />
    );
  }
  return (
    <Stack
      direction="row"
      spacing={0.5}
      aria-label={description}
      sx={{ alignItems: 'center', color: good ? 'success.main' : 'error.main', display: 'inline-flex' }}
    >
      {icon}
      <Typography variant="body2" component="span" sx={{ fontWeight: 600, color: 'inherit' }}>
        {label}
      </Typography>
    </Stack>
  );
}
