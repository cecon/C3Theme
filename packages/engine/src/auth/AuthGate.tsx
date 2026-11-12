import { ReactNode } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { AppSkeleton, C3ThemeProvider, C3ThemeProviderProps, LocaleMessages, Notifier, WindowDragBar } from '@c3theme/ui';
import AuthScreens from './AuthScreens';
import type { DesktopHost } from '../desktop/port';
import type { C3Fetch } from '../transport';
import type { RouterMode } from '../router';
import type { AuthPort } from './port';
import { AuthSession, AuthSessionProvider } from './session';

interface AuthGateProps {
  port: AuthPort;
  apiUrl: string;
  basename?: string;
  router?: RouterMode;
  transport?: C3Fetch;
  theme?: Omit<C3ThemeProviderProps, 'children' | 'loadMessages'>;
  loadMessages?: (locale: string) => Promise<LocaleMessages>;
  /** App de desktop: antes de entrar o app.json ainda não chegou, então a faixa de arrastar vale pela plataforma. */
  desktopHost?: DesktopHost;
  /** O sistema, montado só com usuário. */
  children: (session: AuthSession) => ReactNode;
}

/** Sem usuário, as telas de entrada (com o tema do sistema); com usuário, o sistema. Sair volta para cá. */
export default function AuthGate({ port, apiUrl, basename, router, transport, theme, loadMessages, desktopHost, children }: AuthGateProps) {
  const frame = (name: string, body: ReactNode) => (
    <C3ThemeProvider {...theme} loadMessages={loadMessages} branding={{ name, homePath: '/', ...theme?.branding }}>
      {desktopHost && <WindowDragBar desktop={{ platform: desktopHost.platform }} />}
      {body}
      <Notifier />
    </C3ThemeProvider>
  );

  return (
    <AuthSessionProvider
      port={port}
      apiUrl={apiUrl}
      transport={transport}
      loading={frame('', <AppSkeleton />)}
      failed={(message, retry) =>
        frame(
          '',
          <Box sx={{ p: 4, maxWidth: 560, mx: 'auto', mt: 8 }}>
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={retry}>
                  Tentar de novo
                </Button>
              }
            >
              Não foi possível abrir o sistema: {message}
            </Alert>
          </Box>
        )
      }
    >
      {(session) => (session.user ? children(session) : frame(session.appName, <AuthScreens basename={basename} router={router} />))}
    </AuthSessionProvider>
  );
}
