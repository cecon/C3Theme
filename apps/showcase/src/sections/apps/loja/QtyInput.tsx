// material-ui
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Add, Minus } from 'iconsax-reactjs';

interface Props {
  value: number;
  max?: number;
  onChange: (v: number) => void;
  label?: string;
  size?: 'small' | 'medium';
}

/** Seletor de quantidade com − e +. */
export default function QtyInput({ value, max = 99, onChange, label = 'Quantidade', size = 'medium' }: Props) {
  return (
    <Stack
      direction="row"
      role="group"
      aria-label={label}
      sx={{ alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: 2, width: 'fit-content', flexShrink: 0 }}
    >
      <IconButton size={size} aria-label="Diminuir" disabled={value <= 1} onClick={() => onChange(value - 1)}>
        <Minus size={16} />
      </IconButton>
      <Typography aria-live="polite" sx={{ minWidth: 32, textAlign: 'center', fontWeight: 600 }}>
        {value}
      </Typography>
      <IconButton size={size} aria-label="Aumentar" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Add size={16} />
      </IconButton>
    </Stack>
  );
}
