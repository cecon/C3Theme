// Porta da janela de desktop: o que só quem roda o app sabe (a plataforma e o entalhe da tela). O app.json declara a
// moldura (`layout.desktop`); esta porta diz onde ela é desenhada. No Electron, `electronDesktop()` de
// @c3theme/electron/renderer; no navegador, nenhuma (e a moldura não aparece). Sem React.

import type { DesktopPlatform } from '@c3theme/ui';

export interface DesktopHost {
  platform: DesktopPlatform;
  /** Largura (px) do entalhe da câmera no Mac, quando a janela ocupa a tela dele. Sem isso, nenhum. */
  notch?: number;
}
