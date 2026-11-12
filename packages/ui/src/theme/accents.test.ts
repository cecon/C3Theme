import { describe, expect, it, vi } from 'vitest';
import { accentLuminance, parseAccentColor, type Rgb } from './accentColor';
import { accentColors, compileAccent } from './accents';
import { createC3Theme } from './createC3Theme';
import { tokenProblems } from './tokens';

describe('cores nomeadas', () => {
  it('valida nomes e cores; cor inválida avisa e não substitui a comum válida', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const tokens = {
      accents: { forge: { start: '#8B2A10' }, 'nome inválido': { start: '#fff' } },
      dark: { accents: { forge: { start: 'banana' } } }
    };
    const theme = createC3Theme({ tokens });
    expect(tokenProblems(tokens)).toHaveLength(2);
    expect(warn).toHaveBeenCalled();
    expect(theme.colorSchemes.dark!.palette.accents!.forge.start).toBe('rgb(139, 42, 16)');
    expect(theme.colorSchemes.light!.palette.accents!['nome inválido']).toBeUndefined();
    expect(accentColors(theme, 'accent:forge')?.backgroundImage).toContain('var(');
    expect(accentColors(theme, 'accent:missing')).toBeUndefined();
    expect(accentColors(theme, 'accent:missing')).toBeUndefined();
    expect(accentColors(theme, 'accent:constructor')).toBeUndefined();
    expect(accentColors(theme, undefined)).toBeUndefined();
    warn.mockRestore();
  });

  it('cores comuns, overrides e fallback do outro modo existem nos dois modos', () => {
    const theme = createC3Theme({
      tokens: {
        accents: { forge: { start: '#111', end: '#222' } },
        dark: { accents: { forge: { start: '#eee' }, sage: { start: '#fff' } } }
      }
    });
    expect(theme.colorSchemes.light!.palette.accents!.forge.start).toBe('rgb(17, 17, 17)');
    expect(theme.colorSchemes.dark!.palette.accents!.forge.start).toBe('rgb(238, 238, 238)');
    expect(theme.colorSchemes.light!.palette.accents!.sage).toEqual(theme.colorSchemes.dark!.palette.accents!.sage);
  });

  it('alpha resolve sobre o paper efetivo de cada modo, também quando o paper é transparente', () => {
    const theme = createC3Theme({
      tokens: {
        accents: { fade: { start: '#fff0' } },
        light: { paper: '#fafafa' },
        dark: { paper: 'rgba(0, 0, 0, 0)', background: '#111111' }
      }
    });
    expect(theme.colorSchemes.light!.palette.accents!.fade.start).toBe('rgb(250, 250, 250)');
    expect(theme.colorSchemes.dark!.palette.accents!.fade.start).toBe('rgb(17, 17, 17)');
  });

  it.each([
    ['#ff0000', '#00ff00'],
    ['#ffffff', '#000000'],
    ['#f4edbe', '#ffeefd'],
    ['rgba(255, 0, 0, .3)', '#00ff0088'],
    ['hsl(240 100% 50%)', 'rgb(100% 100% 0%)']
  ])('garante texto 4,5:1 inclusive no interior e com alpha: %s / %s', (start, end) => {
    for (const background of [
      [255, 255, 255],
      [13, 17, 23]
    ] as Rgb[]) {
      const accent = compileAccent({ start, end }, background);
      const a = parseAccentColor(accent.start)!.slice(0, 3) as Rgb;
      const b = parseAccentColor(accent.end)!.slice(0, 3) as Rgb;
      for (let i = 0; i <= 1000; i++) {
        const lum = accentLuminance(a.map((v, k) => v + ((b[k] - v) * i) / 1000) as Rgb);
        expect(accent.contrastText === '#FFFFFF' ? 1.05 / (lum + 0.05) : (lum + 0.05) / 0.05).toBeGreaterThanOrEqual(4.5);
      }
      expect(accent.background).toContain('in srgb');
    }
  });

  it('recusa sintaxe desconhecida e normaliza RGB, HSL e alpha', () => {
    for (const value of [null, 'red', '#12345', 'rgb(foo)', 'rgb(1,2)', 'rgb(1,2,3,4,5)', 'hsl(30 2 3)', 'hsl(30% 2% 3%)'])
      expect(parseAccentColor(value)).toBeUndefined();
    expect(parseAccentColor('#fff8')).toEqual([255, 255, 255, 136 / 255]);
    expect(parseAccentColor('rgba(1 2 3 / 50%)')).toEqual([1, 2, 3, 0.5]);
    expect(parseAccentColor('rgb(-50 400 10 / 400%)')).toEqual([0, 255, 10, 1]);
    expect(parseAccentColor('rgb(20 30 40 / -20%)')).toEqual([20, 30, 40, 0]);
    expect(parseAccentColor(`hsl(${'9'.repeat(400)} 50% 50%)`)).toBeUndefined();
    const adjusted = compileAccent({ start: '#ff0000', end: '#00ff00' }, [255, 255, 255]);
    expect(parseAccentColor(adjusted.start)![0]).toBeGreaterThan(200);
    expect(parseAccentColor(adjusted.start)!.slice(1, 3)).toEqual([0, 0]);
    for (const h of [0, 60, 120, 180, 240, 300, -60]) expect(parseAccentColor(`hsl(${h},100%,50%)`)).toBeDefined();
  });
});
