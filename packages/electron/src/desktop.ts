// Adaptador do renderer para a porta da janela de desktop do motor (`DesktopHost` de @c3theme/engine): diz em que
// plataforma a janela roda, para a shell montar a moldura do `layout.desktop`. Sem Electron.

export type DesktopPlatform = 'mac' | 'windows' | 'linux';

/** O pedaço do `navigator` que diz o sistema: `userAgentData.platform` ("macOS") ou o antigo `platform` ("MacIntel"). */
export interface NavigatorLike {
  platform?: string;
  userAgentData?: { platform?: string };
}

/** Plataforma pelo `navigator` do renderer. O que não for Mac nem Windows conta como Linux (sem botões a desviar). */
export function platformOf(nav: NavigatorLike): DesktopPlatform {
  const name = (nav.userAgentData?.platform || nav.platform || '').toLowerCase();
  if (name.startsWith('mac')) return 'mac';
  if (name.startsWith('win')) return 'windows';
  return 'linux';
}

export interface ElectronDesktopOptions {
  /** Largura (px) do entalhe da câmera no Mac, se a janela ocupa a tela dele. O Electron não informa: vem do app. */
  notch?: number;
  /** Padrão: o `navigator` do renderer. */
  nav?: NavigatorLike;
}

/** No renderer: `<C3Shell desktopHost={electronDesktop()} />`. A moldura em si vem do app.json. */
export function electronDesktop({ notch, nav = globalThis.navigator }: ElectronDesktopOptions = {}) {
  return { platform: platformOf(nav), ...(notch !== undefined && { notch }) };
}
