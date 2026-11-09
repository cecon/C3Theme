import { describe, expect, it } from 'vitest';

import { avatarSpec, avatarTone, initialsOf, joined } from './richCell';

describe('célula composta', () => {
  it('iniciais das duas primeiras palavras', () => {
    expect(initialsOf('ana maria souza')).toBe('AM');
    expect(initialsOf('  Bruno ')).toBe('B');
    expect(initialsOf('')).toBe('');
    expect(initialsOf('Construtora Horizonte', 1)).toBe('C');
  });

  it('tom estável pelo id, numérico ou não', () => {
    expect(avatarTone('1')).toBe('info');
    expect(avatarTone('4')).toBe('primary');
    expect(avatarTone('abc')).toBe(avatarTone('abc'));
  });

  it('emenda sem os vazios', () => {
    expect(joined(['Recife', 'PE'])).toBe('Recife - PE');
    expect(joined(['Recife', ''])).toBe('Recife');
    expect(joined(['', 'PE'])).toBe('PE');
  });

  it('avatar em forma única', () => {
    expect(avatarSpec(true)).toEqual({ letters: 2, tone: 'auto' });
    expect(avatarSpec('foto')).toEqual({ photo: 'foto', letters: 2, tone: 'auto' });
    expect(avatarSpec({ letters: 1, tone: 'neutral' })).toEqual({ photo: undefined, letters: 1, tone: 'neutral' });
    expect(avatarSpec(undefined)).toBeUndefined();
  });
});
