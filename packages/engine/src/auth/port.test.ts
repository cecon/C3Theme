import { describe, expect, it, vi } from 'vitest';
import { entradaPorCodigo, modoDeEntrada, type AuthPort } from './port';
import { rotasDeEntrada } from './AuthScreens';

const sessao = { token: 't', user: { id: 'u', name: 'Ana' } };

describe('modo de entrada declarado pela porta (#123)', () => {
  it('código só vale com os dois métodos; senha vale com login; sem nada é indefinido', () => {
    expect(
      modoDeEntrada({ entrada: 'codigo', me: vi.fn(), enviarCodigo: vi.fn(), entrarComCodigo: vi.fn(() => Promise.resolve(sessao)) })
    ).toBe('codigo');
    expect(modoDeEntrada({ entrada: 'codigo', me: vi.fn(), enviarCodigo: vi.fn() })).toBeUndefined();
    expect(modoDeEntrada({ entrada: 'senha', me: vi.fn(), login: vi.fn(() => Promise.resolve(sessao)) })).toBe('senha');
    expect(modoDeEntrada({ me: vi.fn(), login: vi.fn(() => Promise.resolve(sessao)) })).toBe('senha');
    expect(modoDeEntrada({ me: vi.fn() })).toBeUndefined();
  });

  it('entrada por código é a única que liga o fluxo sem senha', () => {
    const codigo = {
      entrada: 'codigo',
      me: vi.fn(),
      enviarCodigo: vi.fn(),
      entrarComCodigo: vi.fn(() => Promise.resolve(sessao))
    } as AuthPort;
    const senha = { me: vi.fn(), login: vi.fn(() => Promise.resolve(sessao)) } as AuthPort;
    expect(entradaPorCodigo(codigo)).toBe(true);
    expect(entradaPorCodigo(senha)).toBe(false);
  });

  it('porta sem método de entrada não monta telas: falha cedo e clara', () => {
    expect(() => rotasDeEntrada({}, { me: vi.fn() })).toThrow('não declara entrada por senha nem por código');
  });
});
