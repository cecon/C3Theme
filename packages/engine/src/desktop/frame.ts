// Moldura do desktop pela spec: junta o `layout.desktop` do app.json com a porta `DesktopHost` (a plataforma) e diz o
// que o layout e o tema recebem. Sem React.

import { desktopTokens, type C3Tokens, type DesktopOptions } from '@c3theme/ui';

import type { DesktopHost } from './port';

/** `layout.desktop` do app.json (spec/v0/app.schema.json). */
export interface DesktopDef {
  titleBar?: 'hidden' | 'system';
  translucent?: boolean | number;
  drawerFrom?: number;
  density?: 'compact' | 'comfortable';
  systemFont?: boolean;
}

/** A moldura resolvida: opções do `AppLayout`, tokens do tema (fonte e densidade) e o entalhe, para a faixa do chat. */
export interface DesktopFrame {
  options: DesktopOptions;
  tokens: C3Tokens;
  notch?: number;
}

/** Sem a declaração ou sem a porta (o app no navegador), não há moldura: o layout e o tema ficam os do site. */
export function desktopFrame(def: DesktopDef | undefined, host: DesktopHost | undefined): DesktopFrame | null {
  if (!def || !host) return null;
  const { platform, notch } = host;
  const options: DesktopOptions = {
    platform,
    ...(def.titleBar === 'system' && { controls: false }),
    ...(def.translucent !== undefined && { translucent: def.translucent }),
    ...(def.drawerFrom !== undefined && { drawerFrom: def.drawerFrom })
  };
  const tokens = desktopTokens(platform, {
    compact: def.density !== 'comfortable',
    ...(def.systemFont !== undefined && { systemFont: def.systemFont })
  });
  return { options, tokens, ...(notch !== undefined && { notch }) };
}

/** A prop `desktop` antiga do <C3Shell> (só o layout, sem tema), para quem ainda não declarou no app.json. */
export const frameFromOptions = (options: DesktopOptions): DesktopFrame => ({ options, tokens: {} });

/** Tokens do app por cima dos da moldura: o que o sistema passou em `theme.tokens` vence. */
export function frameTokens(frame: DesktopFrame | null, tokens: C3Tokens | undefined): C3Tokens | undefined {
  return frame ? { ...frame.tokens, ...tokens } : tokens;
}
