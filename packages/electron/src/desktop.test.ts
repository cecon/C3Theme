import { afterEach, describe, expect, it, vi } from 'vitest';

import { electronDesktop, platformOf } from './desktop';
import { windowFrame, WINDOWS_CONTROLS_HEIGHT } from './frame';

afterEach(() => vi.unstubAllGlobals());

describe('platformOf', () => {
  it('lê o userAgentData e, sem ele, o platform antigo', () => {
    expect(platformOf({ userAgentData: { platform: 'macOS' }, platform: 'Win32' })).toBe('mac');
    expect(platformOf({ platform: 'MacIntel' })).toBe('mac');
    expect(platformOf({ userAgentData: { platform: 'Windows' } })).toBe('windows');
    expect(platformOf({ userAgentData: { platform: '' }, platform: 'Win32' })).toBe('windows');
    expect(platformOf({ platform: 'Linux x86_64' })).toBe('linux');
    expect(platformOf({})).toBe('linux');
  });
});

describe('electronDesktop', () => {
  it('a porta com a plataforma do navigator e o entalhe que o app passou', () => {
    expect(electronDesktop({ nav: { platform: 'MacIntel' }, notch: 190 })).toEqual({ platform: 'mac', notch: 190 });
    expect(electronDesktop({ nav: { platform: 'Win32' } })).toEqual({ platform: 'windows' });
  });

  it('sem `nav`, usa o navigator do renderer', () => {
    vi.stubGlobal('navigator', { platform: 'MacIntel' });
    expect(electronDesktop()).toEqual({ platform: 'mac' });
  });
});

describe('windowFrame', () => {
  it('sem a declaração, a janela do sistema', () => {
    expect(windowFrame(undefined, 'darwin')).toEqual({});
  });

  it('Mac: barra escondida com os botões recuados e vibrancy no menu translúcido', () => {
    expect(windowFrame({}, 'darwin')).toEqual({ titleBarStyle: 'hiddenInset' });
    expect(windowFrame({ translucent: true }, 'darwin')).toEqual({ titleBarStyle: 'hiddenInset', vibrancy: 'sidebar' });
    expect(windowFrame({ titleBar: 'system', translucent: 0.5 }, 'darwin')).toEqual({ vibrancy: 'sidebar' });
  });

  it('Windows: botões do sistema por cima da página na altura que a shell reserva, e mica', () => {
    expect(windowFrame({ titleBar: 'hidden' }, 'win32')).toEqual({
      titleBarStyle: 'hidden',
      titleBarOverlay: { height: WINDOWS_CONTROLS_HEIGHT }
    });
    expect(WINDOWS_CONTROLS_HEIGHT).toBe(32);
    expect(windowFrame({ titleBar: 'system', translucent: 0 }, 'win32')).toEqual({ backgroundMaterial: 'mica' });
  });

  it('menu opaco (falso ou opacidade 1) não liga material; no Linux fica a barra do sistema', () => {
    expect(windowFrame({ titleBar: 'system', translucent: 1 }, 'darwin')).toEqual({});
    expect(windowFrame({ titleBar: 'system', translucent: false }, 'win32')).toEqual({});
    expect(windowFrame({ translucent: true }, 'linux')).toEqual({});
  });
});
