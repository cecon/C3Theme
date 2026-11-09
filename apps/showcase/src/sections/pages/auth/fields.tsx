import { forwardRef, ReactNode, useState } from 'react';
import { useOutletContext } from 'react-router';

// material-ui
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { Apple, Eye, EyeSlash, Facebook, Google } from 'iconsax-reactjs';

import { notify } from '@c3theme/ui';

export type AuthScreen = 'login' | 'cadastro' | 'esqueci-senha' | 'confira-email' | 'codigo-verificacao' | 'nova-senha';

/** O que cada estilo de autenticação passa para as telas: para onde apontar cada link. */
export interface AuthContext {
  to: (screen: AuthScreen) => string;
}

export const useAuthLinks = () => useOutletContext<AuthContext>();

/** Links de um estilo que tem todas as telas sob o mesmo prefixo. */
export const linksFor = (base: string): AuthContext => ({ to: (s) => `${base}/${s}` });

/** Espera curta para simular a chamada ao servidor. */
export const wait = (ms = 700) => new Promise((r) => setTimeout(r, ms));

export const PasswordInput = forwardRef<HTMLInputElement, TextFieldProps>(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false);
  return (
    <TextField
      fullWidth
      {...props}
      inputRef={ref}
      type={show ? 'text' : 'password'}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShow((s) => !s)} edge="end">
                {show ? <EyeSlash size={18} /> : <Eye size={18} />}
              </IconButton>
            </InputAdornment>
          )
        }
      }}
    />
  );
});

/** Título e texto de apoio no topo de cada tela. */
export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <Stack spacing={0.75} sx={{ mb: 3 }}>
      <Typography variant="h3" component="h1">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Stack>
  );
}

const PROVIDERS = [
  { name: 'Google', icon: Google },
  { name: 'Facebook', icon: Facebook },
  { name: 'Apple', icon: Apple }
];

/** Entrar com contas externas (simulado). */
export function SocialButtons({ action }: { action: string }) {
  return (
    <>
      <Divider sx={{ my: 3 }}>
        <Typography variant="caption" color="text.secondary">
          ou {action} com
        </Typography>
      </Divider>
      <Stack direction="row" spacing={1.5}>
        {PROVIDERS.map(({ name, icon: Icon }) => (
          <Button
            key={name}
            fullWidth
            variant="outlined"
            color="inherit"
            aria-label={`${action} com ${name}`}
            onClick={() => notify(`Simulação: ${action} com ${name} não está conectado nesta vitrine.`, 'info')}
            sx={{ borderColor: 'divider', py: 1 }}
          >
            <Icon size={20} variant="Bold" />
          </Button>
        ))}
      </Stack>
    </>
  );
}
