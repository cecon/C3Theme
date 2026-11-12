import { ReactNode, useEffect, useMemo, useState } from 'react';
import { IntlProvider } from 'react-intl';

// emotion
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';

// material-ui
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';

import {
  Branding,
  BrandingProvider,
  ConfigProvider,
  DEFAULT_UI_CONFIG,
  LocaleOption,
  LocalesProvider,
  UiConfig,
  useUiConfig
} from './config';
import { uiMessagesFor } from './i18n';
import { createC3Theme } from './theme/createC3Theme';
import type { C3Tokens } from './theme/tokens';
import type { ColorModePreference } from './theme/useColorMode';

export type LocaleMessages = Record<string, string>;

export interface C3ThemeProviderProps {
  children: ReactNode;
  branding?: Partial<Branding>;
  /** Valores iniciais das preferências; o que o usuário mudar fica salvo em `storageKey`. */
  defaultConfig?: Partial<UiConfig>;
  /** Modo na primeira abertura; a preferência salva da pessoa tem prioridade. Padrão: `system`. */
  defaultMode?: ColorModePreference;
  storageKey?: string;
  /**
   * Tokens do design system do app (cores por modo, raio, fonte) por cima do visual escolhido. Passe um objeto
   * estável (constante ou useMemo): um novo a cada render recria o tema.
   */
  tokens?: C3Tokens;
  /** Argumento extra do createTheme. Os textos do MUI já seguem o idioma escolhido; isto vai por cima. */
  themeOverrides?: object;
  /** Mensagens do react-intl por idioma. Sem isso, valem os textos literais e os defaultMessage. */
  loadMessages?: (locale: string) => Promise<LocaleMessages>;
  /** Idiomas oferecidos no painel de preferências. */
  locales?: LocaleOption[];
}

const DEFAULT_LOCALES: LocaleOption[] = [{ code: 'pt-BR', label: 'Português' }];

// com RTL o emotion espelha margens, paddings e posições. O CacheProvider fica sempre montado e só troca o cache:
// trocar o elemento da árvore remontaria o app inteiro e perderia o estado das telas.
const ltrCache = createCache({ key: 'mui' });
const rtlCache = createCache({ key: 'muirtl', stylisPlugins: [prefixer, rtlPlugin] });

/** Tema, modo claro/escuro, preferências salvas, marca e i18n numa peça só. */
export default function C3ThemeProvider({
  children,
  branding,
  defaultConfig,
  defaultMode = 'system',
  storageKey = 'c3-ui',
  tokens,
  themeOverrides,
  loadMessages,
  locales = DEFAULT_LOCALES
}: C3ThemeProviderProps) {
  const defaults = useMemo(() => ({ ...DEFAULT_UI_CONFIG, ...defaultConfig }), [defaultConfig]);
  const brand = useMemo(() => ({ name: 'C3', homePath: '/', ...branding }), [branding]);

  return (
    <ConfigProvider storageKey={storageKey} defaults={defaults}>
      <ThemedApp
        storageKey={storageKey}
        defaultMode={defaultMode}
        tokens={tokens}
        themeOverrides={themeOverrides}
        loadMessages={loadMessages}
      >
        <LocalesProvider value={locales}>
          <BrandingProvider value={brand}>{children}</BrandingProvider>
        </LocalesProvider>
      </ThemedApp>
    </ConfigProvider>
  );
}

function ThemedApp({
  children,
  storageKey,
  defaultMode,
  tokens,
  themeOverrides,
  loadMessages
}: Omit<C3ThemeProviderProps, 'branding' | 'defaultConfig' | 'locales'>) {
  const { config } = useUiConfig();
  const theme = useMemo(
    () =>
      createC3Theme({
        look: config.look,
        brand: config.brand,
        fontFamily: config.fontFamily,
        contrast: config.contrast,
        direction: config.direction,
        tokens,
        locale: config.locale,
        overrides: themeOverrides
      }),
    [config.look, config.brand, config.fontFamily, config.contrast, config.direction, config.locale, tokens, themeOverrides]
  );

  useEffect(() => {
    document.documentElement.dir = config.direction;
    document.documentElement.lang = config.locale;
  }, [config.direction, config.locale]);

  const [messages, setMessages] = useState<LocaleMessages>({});
  useEffect(() => {
    let active = true;
    (loadMessages?.(config.locale) ?? Promise.resolve({})).then((m) => active && setMessages(m)).catch(() => active && setMessages({}));
    return () => {
      active = false;
    };
  }, [config.locale, loadMessages]);

  const allMessages = useMemo(() => ({ ...uiMessagesFor(config.locale), ...messages }), [config.locale, messages]);

  return (
    <CacheProvider value={config.direction === 'rtl' ? rtlCache : ltrCache}>
      <ThemeProvider theme={theme} modeStorageKey={`${storageKey}-mode`} defaultMode={defaultMode}>
        <CssBaseline />
        {/* texto sem tradução cai no defaultMessage; não vale poluir o console com isso */}
        <IntlProvider locale={config.locale} messages={allMessages} onError={() => {}}>
          {children}
        </IntlProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}
