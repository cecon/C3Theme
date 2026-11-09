import { describe, expect, it } from 'vitest';

import { createC3Theme } from '../theme/createC3Theme';
import { COMPACT_FIELD_HEIGHT } from '../theme/density';
import {
  controlsInset,
  DESKTOP_DRAWER_FROM,
  desktopTokens,
  dragRegionSx,
  pinnedDrawerQuery,
  resolveDesktop,
  seeThrough,
  SYSTEM_FONT
} from './desktop';

describe('app de desktop', () => {
  it('cada plataforma tem o canto e o tamanho dos botões da janela', () => {
    expect(resolveDesktop({ platform: 'mac' }).controls).toEqual({ side: 'left', width: 78, height: 28 });
    expect(resolveDesktop({ platform: 'windows' }).controls).toEqual({ side: 'right', width: 138, height: 32 });
    expect(resolveDesktop({ platform: 'linux' }).controls).toBeNull();
  });

  it('o recuo é configurável e some com false', () => {
    expect(resolveDesktop({ platform: 'mac', controls: { width: 90 } }).controls).toEqual({ side: 'left', width: 90, height: 28 });
    expect(resolveDesktop({ platform: 'linux', controls: { side: 'right', width: 100, height: 30 } }).controls?.side).toBe('right');
    expect(resolveDesktop({ platform: 'mac', controls: false }).controls).toBeNull();
    expect(resolveDesktop({ platform: 'mac', controls: { width: 0 } }).controls).toBeNull();
  });

  it('translúcido: true é transparente, número é a opacidade (limitada a 0–1), sem a opção fica opaco', () => {
    expect(resolveDesktop({ platform: 'mac', translucent: true }).sidebarOpacity).toBe(0);
    expect(resolveDesktop({ platform: 'mac', translucent: 0.4 }).sidebarOpacity).toBe(0.4);
    expect(resolveDesktop({ platform: 'mac', translucent: 3 }).sidebarOpacity).toBe(1);
    expect(resolveDesktop({ platform: 'mac' }).sidebarOpacity).toBeNull();
    expect(seeThrough('var(--x)', 0)).toBe('transparent');
    expect(seeThrough('var(--x)', 0.4)).toBe('color-mix(in srgb, var(--x) 40%, transparent)');
  });

  it('a faixa de arrastar devolve o clique aos interativos, menos a quem só recebe foco por código', () => {
    const selector = Object.keys(dragRegionSx as object).find((k) => k.startsWith('& :is('))!;
    expect(selector).toContain('button');
    expect(selector).toContain('[tabindex]:not([tabindex="-1"])');
  });

  it('o recuo só vai no lado dos botões', () => {
    const mac = resolveDesktop({ platform: 'mac' }).controls;
    expect(controlsInset(mac, 'left')).toEqual({ ml: '78px' });
    expect(controlsInset(mac, 'right')).toEqual({});
    expect(controlsInset(null, 'left')).toEqual({});
  });

  it('tokens de desktop: fonte do sistema só no Mac, compacto em todos, e o app pode trocar', () => {
    expect(desktopTokens('mac')).toEqual({ fontFamily: SYSTEM_FONT, density: 'compact' });
    expect(desktopTokens('windows')).toEqual({ density: 'compact' });
    expect(desktopTokens('mac', { fontFamily: 'Inter', radius: 6 })).toEqual({ fontFamily: 'Inter', density: 'compact', radius: 6 });
    expect(desktopTokens('mac', { compact: false, systemFont: false })).toEqual({});
  });

  it('o tema compacto encolhe texto, campos e componentes sem perder o acabamento', () => {
    const theme = createC3Theme({ tokens: desktopTokens('mac') });
    expect(theme.density).toBe('compact');
    expect(theme.fieldHeight).toEqual(COMPACT_FIELD_HEIGHT);
    expect(theme.typography.fontSize).toBe(13);
    expect(theme.typography.fontFamily).toBe(SYSTEM_FONT);
    expect(theme.components?.MuiButton?.defaultProps).toEqual({ disableElevation: true, size: 'small' });
    expect(theme.components?.MuiTable?.defaultProps).toEqual({ size: 'small' });

    const site = createC3Theme();
    expect(site.density).toBe('comfortable');
    expect(site.typography.fontSize).toBe(14);
    expect(site.components?.MuiButton?.defaultProps).toEqual({ disableElevation: true });
  });

  it('drawerFrom: padrão 720 px, inválido volta ao padrão, e sem desktop a query é o lg do tema', () => {
    expect(resolveDesktop({ platform: 'mac' }).drawerFrom).toBe(DESKTOP_DRAWER_FROM);
    expect(resolveDesktop({ platform: 'mac', drawerFrom: 900.4 }).drawerFrom).toBe(900);
    expect(resolveDesktop({ platform: 'mac', drawerFrom: 0 }).drawerFrom).toBe(0);
    for (const bad of [-1, Number.NaN, Number.POSITIVE_INFINITY])
      expect(resolveDesktop({ platform: 'mac', drawerFrom: bad }).drawerFrom).toBe(720);
    expect(pinnedDrawerQuery(resolveDesktop({ platform: 'windows', drawerFrom: 800 }))).toBe('(min-width:800px)');
    const site = pinnedDrawerQuery(null);
    expect(typeof site === 'function' && site(createC3Theme())).toBe('@media (min-width:1200px)');
  });
});
