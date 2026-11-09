import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import type { BrandColor, Look } from './theme/createC3Theme';

/** `rail`: trilho de módulos à esquerda e painel com as telas do módulo escolhido (dois níveis). */
export type MenuOrientation = 'vertical' | 'horizontal' | 'rail';
export type Direction = 'ltr' | 'rtl';

/** Preferências de interface que o usuário pode trocar e que ficam salvas no navegador. */
export interface UiConfig {
  /** Visual do tema: o da C3 ou o do template Angle (para telas do motor dentro de um sistema Angle). */
  look: Look;
  brand: BrandColor;
  fontFamily?: string;
  menuOrientation: MenuOrientation;
  /** Menu lateral recolhido (só ícones) em telas grandes. */
  miniDrawer: boolean;
  /** Títulos dos grupos no menu lateral. */
  menuCaption: boolean;
  /** Conteúdo centralizado com largura máxima; `false` ocupa a tela toda. */
  container: boolean;
  /** Cartões com sombra sobre fundo branco, em vez de borda sobre fundo cinza. */
  contrast: boolean;
  direction: Direction;
  /** Idioma das mensagens (react-intl) e dos formatos. */
  locale: string;
}

export const DEFAULT_UI_CONFIG: UiConfig = {
  look: 'c3',
  brand: 'blue',
  menuOrientation: 'vertical',
  miniDrawer: false,
  menuCaption: true,
  container: true,
  contrast: false,
  direction: 'ltr',
  locale: 'pt-BR'
};

interface ConfigState {
  config: UiConfig;
  setConfig: (changes: Partial<UiConfig>) => void;
  reset: () => void;
}

const ConfigContext = createContext<ConfigState | null>(null);

function read(key: string): Partial<UiConfig> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}');
  } catch {
    return {};
  }
}

export function ConfigProvider({ storageKey, defaults, children }: { storageKey: string; defaults: UiConfig; children: ReactNode }) {
  const [saved, setSaved] = useState<Partial<UiConfig>>(() => read(storageKey));

  const setConfig = useCallback(
    (changes: Partial<UiConfig>) =>
      setSaved((prev) => {
        const next = { ...prev, ...changes };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // modo privado ou cota cheia: a preferência vale só nesta sessão
        }
        return next;
      }),
    [storageKey]
  );

  const reset = useCallback(() => {
    localStorage.removeItem(storageKey);
    setSaved({});
  }, [storageKey]);

  const value = useMemo(() => ({ config: { ...defaults, ...saved }, setConfig, reset }), [defaults, saved, setConfig, reset]);
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useUiConfig(): ConfigState {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useUiConfig precisa estar dentro do C3ThemeProvider');
  return ctx;
}

/** Nome, logo e página inicial do sistema que usa o tema. */
export interface Branding {
  name: string;
  /** Substitui a marca padrão no menu e no login. */
  logo?: ReactNode;
  /** Texto do quadrado da marca padrão; sem isso, as iniciais do nome ("C3 Vitrine" vira "CV"). */
  mark?: string;
  homePath: string;
}

/** Idiomas que o painel de preferências oferece; o app passa os seus em `C3ThemeProvider locales`. */
export interface LocaleOption {
  code: string;
  label: string;
}

const LocalesContext = createContext<LocaleOption[]>([]);
export const LocalesProvider = LocalesContext.Provider;
export const useLocales = () => useContext(LocalesContext);

const BrandingContext = createContext<Branding>({ name: 'C3', homePath: '/' });
export const BrandingProvider = BrandingContext.Provider;
export const useBranding = () => useContext(BrandingContext);
