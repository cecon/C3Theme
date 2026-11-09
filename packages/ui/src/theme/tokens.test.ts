import { describe, expect, it } from 'vitest';

import { createC3Theme } from './createC3Theme';
import { tokenProblems, withTokens } from './tokens';

const base = {
  primary: { main: '#111111' },
  background: { default: '#F4F6F9', paper: '#FFFFFF' },
  header: { bg: '#F4F6F9', fg: '#000000' }
};

describe('tokens externos', () => {
  it('sobrepõe só o que veio; a barra acompanha o fundo quando não vem própria', () => {
    const p = withTokens(base, { primary: '#00A884', background: '#EFEAE2' });
    expect(p.primary).toEqual({ main: '#00A884' });
    expect(p.background).toEqual({ default: '#EFEAE2', paper: '#FFFFFF' });
    expect(p.header).toEqual({ bg: '#EFEAE2', fg: '#000000' });
  });

  it('cor inválida é ignorada e apontada', () => {
    expect(withTokens(base, { primary: 'verde' }).primary).toEqual({ main: '#111111' });
    expect(tokenProblems({ light: { primary: 'verde', paper: 'rgb(1 2 3)' }, radius: -1 })).toEqual([
      'light.primary: "verde" não é uma cor',
      'radius: -1 não é um raio'
    ]);
  });

  it('o tema sai com os tokens nos dois modos, raio e fonte', () => {
    const theme = createC3Theme({
      tokens: { light: { primary: '#00A884' }, dark: { primary: '#25D366', paper: '#111B21' }, radius: 12, fontFamily: 'Roboto' }
    });
    const schemes = (theme as any).colorSchemes;
    expect(schemes.light.palette.primary.main).toBe('#00A884');
    expect(schemes.dark.palette.primary.main).toBe('#25D366');
    expect(schemes.dark.palette.background.paper).toBe('#111B21');
    expect(theme.shape.borderRadius).toBe(12);
    expect(theme.typography.fontFamily).toBe('Roboto');
  });
});
