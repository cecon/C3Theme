import { useId, type ChangeEvent, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

// third-party
import { TickCircle } from 'iconsax-reactjs';

import { srOnly } from './srOnly';

export interface ChoiceCardProps {
  /** `radio`: um só do grupo (mesmo `name`, setas trocam). `checkbox`: vários. */
  type?: 'radio' | 'checkbox';
  checked: boolean;
  /** Recebe o novo estado. No `radio` só chega `true`: quem desmarca os outros é o app. */
  onChange: (checked: boolean) => void;
  title: ReactNode;
  /** Uma linha de explicação. */
  description?: ReactNode;
  /** Avatar ou ícone à esquerda, ex.: `<SoftAvatar>`. */
  media?: ReactNode;
  name?: string;
  value?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Cartão que dá para marcar: avatar ou ícone, título e uma linha de explicação. Por baixo é um input nativo
 * (radio ou checkbox), então Espaço marca, setas andam no grupo e o leitor de tela anuncia o estado.
 */
export default function ChoiceCard(props: ChoiceCardProps) {
  const { type = 'checkbox', checked, onChange, title, description, media, name, value, disabled, sx } = props;
  const id = useId();
  return (
    <Box
      component="label"
      sx={[
        (theme) => ({
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 2,
          borderRadius: 2,
          border: 1,
          borderColor: checked ? 'primary.main' : 'divider',
          bgcolor: 'background.paper',
          boxShadow: checked ? `inset 0 0 0 1px ${theme.vars.palette.primary.main}` : 'none',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: theme.transitions.create(['border-color', 'box-shadow']),
          '&:hover': disabled || checked ? {} : { borderColor: 'text.secondary' },
          '&:has(input:focus-visible)': { outline: `2px solid ${theme.vars.palette.primary.main}`, outlineOffset: 2 },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' }
        }),
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    >
      <Box
        component="input"
        type={type}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        aria-labelledby={`${id}-t`}
        aria-describedby={description ? `${id}-d` : undefined}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
        sx={srOnly}
      />
      {media}
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography id={`${id}-t`} variant="subtitle1" component="span">
          {title}
        </Typography>
        {description && (
          <Typography id={`${id}-d`} variant="body2" color="text.secondary" component="span">
            {description}
          </Typography>
        )}
      </Stack>
      <Box sx={{ display: 'flex', color: checked ? 'primary.main' : 'transparent' }} aria-hidden>
        <TickCircle size={22} variant="Bold" />
      </Box>
    </Box>
  );
}

export interface ChoiceGroupProps {
  /** Pergunta do grupo, ex.: "Que vagas estão faltando?". Vira a legenda do fieldset. */
  label: ReactNode;
  /** Ajuda abaixo da pergunta, ou o erro quando `error`. */
  helperText?: ReactNode;
  error?: boolean;
  /** Cartões por linha a partir de 900 px. Padrão 2. */
  columns?: number;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

/** Grupo de ChoiceCard com pergunta (fieldset + legend) e grade. */
export function ChoiceGroup({ label, helperText, error, columns = 2, children, sx }: ChoiceGroupProps) {
  const helpId = useId();
  return (
    <Box
      component="fieldset"
      aria-describedby={helperText ? helpId : undefined}
      sx={[{ border: 0, m: 0, p: 0, minWidth: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <Typography component="legend" variant="subtitle1" sx={{ p: 0, mb: 1 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: `repeat(${columns}, minmax(0, 1fr))` } }}>{children}</Box>
      {helperText && (
        <Typography
          id={helpId}
          role={error ? 'alert' : undefined}
          variant="caption"
          color={error ? 'error' : 'text.secondary'}
          sx={{ display: 'block', mt: 1 }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
}
