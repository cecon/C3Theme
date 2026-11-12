// material-ui
import Avatar, { AvatarProps } from '@mui/material/Avatar';

import { softColors, toneMain, toneText, Tone } from '../theme/soft';
import { accentColors, type AccentColor } from '../theme/accents';

const SIZES = { xs: 24, sm: 32, md: 40, lg: 56, xl: 72 } as const;

export interface SoftAvatarProps extends Omit<AvatarProps, 'color'> {
  /** Cor nomeada do app, com fundo cheio e contraste AA. Tem precedência sobre look/tone. */
  color?: AccentColor;
  tone?: Tone;
  size?: keyof typeof SIZES;
  /** `soft`: fundo suave; `filled`: cor cheia; `outlined`: só a borda. */
  look?: 'soft' | 'filled' | 'outlined';
}

/** Avatar com iniciais, ícone ou foto nas cores do tema. */
export default function SoftAvatar({ tone = 'primary', color, size = 'md', look = 'soft', sx, ...props }: SoftAvatarProps) {
  const px = SIZES[size];
  return (
    <Avatar
      {...props}
      sx={[
        (theme) => {
          const soft = softColors(theme, tone);
          const base = { width: px, height: px, fontSize: px * 0.4, fontWeight: 600 };
          const accent = accentColors(theme, color);
          if (accent) return { ...base, ...accent };
          if (look === 'filled') {
            // no claro o tom escuro sob texto branco; no escuro o tom cheio sob o texto do fundo (o escuro dava 2,9:1)
            const main = tone === 'neutral' ? theme.vars.palette.text.secondary : soft.color;
            return {
              ...base,
              bgcolor: main,
              color: theme.vars.palette.background.paper,
              ...theme.applyStyles('dark', { bgcolor: toneMain(theme, tone) })
            };
          }
          if (look === 'outlined')
            return { ...base, bgcolor: 'transparent', ...toneText(theme, tone), border: 1, borderColor: 'currentColor' };
          return { ...base, ...soft };
        },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    />
  );
}
