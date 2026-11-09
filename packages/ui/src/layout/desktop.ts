import useMediaQuery from '@mui/material/useMediaQuery';
import type { SystemStyleObject } from '@mui/system';
import type { Theme } from '@mui/material/styles';

import type { C3Tokens } from '../theme/tokens';

export type DesktopPlatform = 'mac' | 'windows' | 'linux';

/** Área dos botões da janela (fechar, minimizar, maximizar) que o conteúdo não pode cobrir. */
export interface WindowControls {
  side: 'left' | 'right';
  width: number;
  height: number;
}

/**
 * App de desktop (Electron, Tauri) com a janela sem barra de título do sistema. Com isso o AppLayout deixa o
 * cabeçalho e o topo do menu arrastarem a janela, abre espaço para os botões da janela e pode deixar a janela
 * aparecer por trás do menu (vibrancy do Mac, mica/acrylic do Windows).
 */
export interface DesktopOptions {
  platform: DesktopPlatform;
  /**
   * Área dos botões da janela. Padrão: Mac 78 × 28 px à esquerda (`titleBarStyle: 'hiddenInset'`), Windows
   * 138 × 32 px à direita (`titleBarOverlay`), Linux nenhuma. `false` (ou `width: 0`) tira o recuo (janela com
   * moldura do sistema).
   */
  controls?: Partial<WindowControls> | false;
  /**
   * Menu lateral com fundo transparente, para a `vibrancy`/`backgroundMaterial` da janela aparecer (a janela precisa
   * de `transparent` ou do material ligado). `true`: transparente; número de 0 a 1: opacidade do fundo do menu.
   * O cabeçalho fica semitransparente com desfoque, para o conteúdo que rola por baixo dele não brigar com o texto.
   */
  translucent?: boolean | number;
  /**
   * Largura da janela (px) a partir da qual o menu lateral fica fixo; abaixo dela vira gaveta com o botão de menu.
   * Padrão: 720 px. Sem `desktop` (site), o limite continua o `lg` do tema (1200 px): num app de desktop a janela
   * estreitada um pouco não deve esconder o menu.
   */
  drawerFrom?: number;
}

export interface ResolvedDesktop {
  platform: DesktopPlatform;
  controls: WindowControls | null;
  /** Opacidade do fundo do menu lateral (0 a 1), ou null quando opaco. */
  sidebarOpacity: number | null;
  /** Largura da janela (px) a partir da qual o menu lateral fica fixo. */
  drawerFrom: number;
}

/** Limite padrão do menu fixo no app de desktop: cabe o menu (260 px) e ainda sobra uma coluna de conteúdo. */
export const DESKTOP_DRAWER_FROM = 720;

// valor inválido (negativo, NaN, Infinity) volta ao padrão em vez de sumir com o menu ou nunca fixá-lo
const drawerLimit = (px: number | undefined) =>
  typeof px === 'number' && Number.isFinite(px) && px >= 0 ? Math.round(px) : DESKTOP_DRAWER_FROM;

const DEFAULT_CONTROLS: Record<DesktopPlatform, WindowControls | null> = {
  mac: { side: 'left', width: 78, height: 28 },
  windows: { side: 'right', width: 138, height: 32 },
  linux: null
};

/** Opacidade do cabeçalho translúcido: o desfoque sozinho não segura o texto sobre conteúdo claro. */
export const HEADER_OPACITY = 0.72;

export function resolveDesktop(options: DesktopOptions): ResolvedDesktop {
  const { platform, controls, translucent, drawerFrom } = options;
  const base = DEFAULT_CONTROLS[platform];
  let resolved: WindowControls | null = null;
  if (controls !== false) {
    const merged = { side: 'left' as const, width: 0, height: 0, ...base, ...controls };
    resolved = merged.width > 0 ? merged : null;
  }
  const opacity = translucent === true ? 0 : typeof translucent === 'number' ? Math.min(1, Math.max(0, translucent)) : null;
  return { platform, controls: resolved, sidebarOpacity: opacity, drawerFrom: drawerLimit(drawerFrom) };
}

/** Media query do menu fixo: no app de desktop, o `drawerFrom`; no site, o `lg` do tema. */
export function pinnedDrawerQuery(app: ResolvedDesktop | null): string | ((theme: Theme) => string) {
  return app ? `(min-width:${app.drawerFrom}px)` : (theme: Theme) => theme.breakpoints.up('lg');
}

/** Opções de desktop resolvidas e se o menu lateral está fixo na largura atual da janela. */
export function useAppFrame(options: DesktopOptions | undefined): { app: ResolvedDesktop | null; pinned: boolean } {
  const app = options ? resolveDesktop(options) : null;
  return { app, pinned: useMediaQuery(pinnedDrawerQuery(app)) };
}

// o Electron lê `-webkit-app-region`; o Tauri lê `app-region` (CSS padrão) e o atributo data-tauri-drag-region
const region = (value: 'drag' | 'no-drag') => ({ WebkitAppRegion: value, appRegion: value });

// tudo o que recebe clique ou foco dentro da área de arrastar continua clicável; tabindex="-1" (foco só por código,
// contêiner rolável) não conta, para não abrir buracos na faixa de arrastar
const INTERACTIVE =
  'a, button, input, textarea, select, label, [role="button"], [role="combobox"], [role="tab"], [tabindex]:not([tabindex="-1"])';

/** Faixa que arrasta a janela; botões, campos e links dentro dela continuam respondendo ao clique. */
export const dragRegionSx = {
  ...region('drag'),
  [`& :is(${INTERACTIVE})`]: region('no-drag')
} as unknown as SystemStyleObject<Theme>;

/** Fundo de uma cor do tema com opacidade, pela variável CSS (vale nos dois modos sem recriar o tema). */
export function seeThrough(cssVar: string, opacity: number): string {
  return opacity <= 0 ? 'transparent' : `color-mix(in srgb, ${cssVar} ${Math.round(opacity * 100)}%, transparent)`;
}

/**
 * Fundo do menu lateral translúcido. O que aparece por trás (a janela) varia, então o item escolhido usa o tom
 * escuro do primário no modo claro: o tom normal fica no limite de 4,5:1 até sobre branco e cai sobre fundo colorido.
 */
export function translucentSidebarSx(theme: Theme, opacity: number): SystemStyleObject<Theme> {
  return {
    bgcolor: seeThrough(theme.vars.palette.background.paper, opacity),
    '& .MuiButtonBase-root.Mui-selected, & .MuiButtonBase-root.Mui-selected .MuiListItemIcon-root': {
      color: theme.vars.palette.primary.dark,
      ...theme.applyStyles('dark', { color: theme.vars.palette.primary.light })
    }
  } as SystemStyleObject<Theme>;
}

/**
 * Recuo para os botões da janela num elemento encostado no lado deles. Vai como margem: o padding da barra muda por
 * tamanho de tela e venceria um recuo fixo.
 */
export function controlsInset(controls: WindowControls | null, side: 'left' | 'right'): SystemStyleObject<Theme> {
  if (!controls || controls.side !== side) return {};
  return side === 'left' ? { ml: `${controls.width}px` } : { mr: `${controls.width}px` };
}

/** Fonte do sistema de cada plataforma: a do Mac (SF) pelo `-apple-system`, Segoe UI no Windows. */
export const SYSTEM_FONT = `-apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', Roboto, Ubuntu, 'Helvetica Neue', sans-serif`;

/**
 * Tokens de tema para app de desktop: densidade compacta e, no Mac, a fonte do sistema. Vão no
 * `C3ThemeProvider tokens` (e não no AppLayout) porque menus, diálogos e avisos abrem fora do layout e precisam
 * do mesmo tamanho e da mesma fonte. Some com `extra` os outros tokens do app; passe o resultado estável (useMemo).
 */
export function desktopTokens(
  platform: DesktopPlatform,
  { systemFont = platform === 'mac', compact = true, ...extra }: C3Tokens & { systemFont?: boolean; compact?: boolean } = {}
): C3Tokens {
  return {
    ...(systemFont && { fontFamily: SYSTEM_FONT }),
    ...(compact && { density: 'compact' as const }),
    ...extra
  };
}
