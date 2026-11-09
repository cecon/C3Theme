// material-ui
import IconButton, { IconButtonProps } from '@mui/material/IconButton';

import { softColors, toneMain, Tone } from '../theme/soft';

export interface SoftIconButtonProps extends Omit<IconButtonProps, 'color'> {
  tone?: Tone;
  /** `soft`: fundo suave; `outlined`: borda no tom; `dashed`: borda tracejada (ex.: "adicionar"). */
  look?: 'soft' | 'outlined' | 'dashed';
  shape?: 'rounded' | 'circle';
}

/** Botão de ícone com fundo ou borda na cor do tom. */
export default function SoftIconButton({ tone = 'primary', look = 'soft', shape = 'rounded', sx, ...props }: SoftIconButtonProps) {
  return (
    <IconButton
      {...props}
      sx={[
        (theme) => ({
          borderRadius: shape === 'circle' ? '50%' : 2,
          ...(look === 'soft'
            ? { ...softColors(theme, tone), '&:hover': { filter: 'brightness(0.95)' } }
            : { color: toneMain(theme, tone), border: 1, borderStyle: look === 'dashed' ? 'dashed' : 'solid', borderColor: 'currentColor' })
        }),
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    />
  );
}
