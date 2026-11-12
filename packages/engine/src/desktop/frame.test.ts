import { describe, expect, it } from 'vitest';

import { SYSTEM_FONT } from '@c3theme/ui';

import { desktopFrame, frameFromOptions, frameTokens } from './frame';

describe('desktopFrame', () => {
  it('sem a declaração ou sem a porta, não há moldura (o app roda como site)', () => {
    expect(desktopFrame(undefined, { platform: 'mac' })).toBeNull();
    expect(desktopFrame({}, undefined)).toBeNull();
  });

  it('declaração vazia no Mac: barra escondida, densidade compacta e fonte do sistema', () => {
    expect(desktopFrame({}, { platform: 'mac' })).toEqual({
      options: { platform: 'mac' },
      tokens: { fontFamily: SYSTEM_FONT, density: 'compact' }
    });
  });

  it('no Windows a fonte do sistema só vem se pedida; o entalhe da porta passa adiante', () => {
    expect(desktopFrame({}, { platform: 'windows', notch: 180 })).toEqual({
      options: { platform: 'windows' },
      tokens: { density: 'compact' },
      notch: 180
    });
    expect(desktopFrame({ systemFont: true }, { platform: 'windows' })?.tokens).toEqual({ fontFamily: SYSTEM_FONT, density: 'compact' });
    expect(desktopFrame({ systemFont: false }, { platform: 'mac' })?.tokens).toEqual({ density: 'compact' });
  });

  it('cada chave da declaração vai para o layout ou para o tema', () => {
    const frame = desktopFrame({ titleBar: 'system', translucent: 0.4, drawerFrom: 900, density: 'comfortable' }, { platform: 'windows' });
    expect(frame).toEqual({ options: { platform: 'windows', controls: false, translucent: 0.4, drawerFrom: 900 }, tokens: {} });
  });

  it('barra escondida declarada e translúcido falso não mudam o padrão do layout', () => {
    expect(desktopFrame({ titleBar: 'hidden', translucent: false, density: 'compact' }, { platform: 'linux' })?.options).toEqual({
      platform: 'linux',
      translucent: false
    });
  });
});

describe('frameFromOptions e frameTokens', () => {
  it('a prop antiga só leva o layout; os tokens do app vencem os da moldura', () => {
    expect(frameFromOptions({ platform: 'mac' })).toEqual({ options: { platform: 'mac' }, tokens: {} });
    const frame = desktopFrame({}, { platform: 'mac' });
    expect(frameTokens(frame, { fontFamily: 'Inter', radius: 6 })).toEqual({ fontFamily: 'Inter', density: 'compact', radius: 6 });
    expect(frameTokens(frame, undefined)).toEqual({ fontFamily: SYSTEM_FONT, density: 'compact' });
    const own = { radius: 4 };
    expect(frameTokens(null, own)).toBe(own);
  });
});
