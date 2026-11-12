// Adaptador do main: abre a janela do Electron com a moldura que o `layout.desktop` do app.json declara, a mesma que a
// shell desenha no renderer (barra de título escondida com os botões da janela, material por trás do menu
// translúcido). Sem Electron: devolve as opções para o `new BrowserWindow`.

/** O pedaço do `layout.desktop` (spec/v0/app.schema.json) que muda a janela; o resto é da shell. */
export interface WindowFrameDef {
  titleBar?: 'hidden' | 'system';
  translucent?: boolean | number;
}

/** Opções do `BrowserWindow` que a moldura liga. */
export interface WindowFrameOptions {
  titleBarStyle?: 'hiddenInset' | 'hidden';
  titleBarOverlay?: { height: number };
  vibrancy?: 'sidebar';
  backgroundMaterial?: 'mica';
}

/** Altura dos botões da janela no Windows: a mesma área que a shell reserva (138 × 32 px à direita). */
export const WINDOWS_CONTROLS_HEIGHT = 32;

// opacidade 1 é menu opaco: não há o que aparecer por trás
const seeThrough = (t: WindowFrameDef['translucent']) => t === true || (typeof t === 'number' && t < 1);

/**
 * No main: `new BrowserWindow({ ...windowFrame(app.layout.desktop, process.platform), ... })`. Sem a declaração,
 * a janela do sistema. No Linux a barra do sistema fica (a shell não desenha botões de janela lá).
 */
export function windowFrame(def: WindowFrameDef | undefined, platform: string): WindowFrameOptions {
  if (!def) return {};
  const hidden = def.titleBar !== 'system';
  const material = seeThrough(def.translucent);
  if (platform === 'darwin')
    return { ...(hidden && { titleBarStyle: 'hiddenInset' as const }), ...(material && { vibrancy: 'sidebar' as const }) };
  if (platform === 'win32')
    return {
      ...(hidden && { titleBarStyle: 'hidden' as const, titleBarOverlay: { height: WINDOWS_CONTROLS_HEIGHT } }),
      ...(material && { backgroundMaterial: 'mica' as const })
    };
  return {};
}
