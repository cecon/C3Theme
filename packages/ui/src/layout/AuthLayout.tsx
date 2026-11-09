import { ReactNode } from 'react';
import { Outlet } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Logo from '../components/Logo';
import { useBranding } from '../config';

export interface AuthLayoutProps {
  /** Painel à esquerda em telas grandes (ex.: mensagem de boas-vindas, imagem). Sem isso, só o cartão centralizado. */
  aside?: ReactNode;
  /** Abaixo do cartão (ex.: links de termos e suporte). */
  footer?: ReactNode;
  /** Conteúdo; sem isso, renderiza a rota filha (`<Outlet />`). */
  children?: ReactNode;
}

/** Moldura das telas sem login: entrar, cadastro, recuperar senha, código de verificação. */
export default function AuthLayout({ aside, footer, children }: AuthLayoutProps) {
  const { name } = useBranding();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      {aside !== undefined && (
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flex: '0 0 44%',
            flexDirection: 'column',
            justifyContent: 'center',
            p: 6,
            color: 'primary.contrastText',
            bgcolor: 'primary.main'
          }}
        >
          {aside ?? (
            <Typography variant="h2" color="inherit">
              {name}
            </Typography>
          )}
        </Box>
      )}
      <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', p: 2, gap: 2 }}>
        <Paper variant="outlined" sx={{ width: '100%', maxWidth: 440, p: { xs: 3, sm: 4 }, borderRadius: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Logo />
          </Box>
          {children ?? <Outlet />}
        </Paper>
        {footer}
      </Stack>
    </Box>
  );
}
