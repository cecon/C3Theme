import { useEffect, useMemo, type ReactNode } from 'react';
import type { Decorator } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';

import Box from '@mui/material/Box';
import { useColorScheme } from '@mui/material/styles';

import { C3ThemeProvider, Notifier, useUiConfig, type BrandColor, type C3Tokens, type Direction, type Look } from '@c3theme/ui';

const LOCALES = [
  { code: 'pt-BR', label: 'Português' },
  { code: 'en-US', label: 'English' }
];

interface Globals {
  look: Look;
  brand: BrandColor;
  mode: 'light' | 'dark';
  direction: Direction;
  locale: string;
}

/** Leva o que está na barra do Storybook para o tema; vence o que o painel de preferências tiver salvo. */
function SyncGlobals({ look, brand, mode, direction, locale, children }: Globals & { children: ReactNode }) {
  const { setConfig } = useUiConfig();
  const { setMode } = useColorScheme();
  useEffect(() => setConfig({ look, brand, direction, locale }), [look, brand, direction, locale, setConfig]);
  useEffect(() => setMode(mode), [mode, setMode]);
  return children;
}

/**
 * Cada história roda dentro do C3ThemeProvider (tema, preferências, i18n), de um roteador em memória (Breadcrumbs,
 * menus e links usam react-router) e com o Notifier montado (avisos do `notify`).
 */
interface FrameProps {
  globals: Globals;
  /** Tela inteira (AppLayout): sem a margem em volta. */
  bare: boolean;
  /** Na aba da história o fundo do tema cobre o quadro todo; na documentação, só o bloco da história. */
  fill: boolean;
  route?: string;
  /** `false` quando a história traz o próprio roteador (a shell inteira, `<C3Shell>`). */
  router: boolean;
  /** Tokens do tema da história (ex.: `desktopTokens('mac')`); objeto constante, para não recriar o tema. */
  tokens?: C3Tokens;
  children: ReactNode;
}

function ThemeFrame({ globals, bare, fill, route, router, tokens, children }: FrameProps) {
  const { look, brand, direction, locale } = globals;
  const defaults = useMemo(() => ({ look, brand, direction, locale }), [look, brand, direction, locale]);
  const body = (
    <>
      <Box sx={{ bgcolor: 'background.default', color: 'text.primary', p: bare ? 0 : 3, minHeight: fill ? '100vh' : undefined }}>
        {children}
      </Box>
      <Notifier />
    </>
  );
  return (
    <C3ThemeProvider
      storageKey="c3-storybook"
      defaultConfig={defaults}
      locales={LOCALES}
      branding={{ name: 'C3 Storybook' }}
      tokens={tokens}
    >
      <SyncGlobals {...globals}>{router ? <MemoryRouter initialEntries={[route ?? '/']}>{body}</MemoryRouter> : body}</SyncGlobals>
    </C3ThemeProvider>
  );
}

export const withC3Theme: Decorator = (Story, { globals, parameters, viewMode }) => (
  <ThemeFrame
    globals={globals as Globals}
    bare={parameters.bare === true}
    fill={viewMode === 'story'}
    route={parameters.route}
    router={parameters.router !== false}
    tokens={parameters.tokens}
  >
    <Story />
  </ThemeFrame>
);
