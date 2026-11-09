import { ReactNode, useState } from 'react';

// material-ui
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { Eye, EyeSlash } from 'iconsax-reactjs';

import { passwordScore } from '@c3theme/ui';
import type { AuthConfig } from '../port';

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** Campo do identificador conforme `auth.identifier`: e-mail validado ou usuário livre. */
export function identifierField(config: AuthConfig) {
  const email = (config.identifier ?? 'email') === 'email';
  return {
    label: email ? 'E-mail' : 'Usuário',
    type: email ? 'email' : 'text',
    autoComplete: email ? 'email' : 'username',
    error: (v: string) => (email ? (isEmail(v) ? undefined : 'Informe um e-mail válido.') : v.trim() ? undefined : 'Informe o usuário.')
  };
}

/** Senha nova: mínimo de 8 e não fraca. */
export function newPasswordError(password: string): string | undefined {
  if (password.length < 8) return 'Use pelo menos 8 caracteres.';
  if (passwordScore(password) < 2) return 'Senha fraca: misture letras, números e símbolos.';
  return undefined;
}

/** Título e subtítulo das telas de autenticação. */
export function AuthHeading({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <Stack spacing={0.5} sx={{ mb: 3 }}>
      <Typography variant="h3">{title}</Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Stack>
  );
}

/** Campo de senha com botão de mostrar/ocultar. */
export function PasswordField(props: TextFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <TextField
      {...props}
      type={show ? 'text' : 'password'}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShow((s) => !s)} edge="end" size="small">
                {show ? <EyeSlash size={18} /> : <Eye size={18} />}
              </IconButton>
            </InputAdornment>
          )
        }
      }}
    />
  );
}

export const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Algo deu errado. Tente de novo.');
