// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { readTabPrefs, tabPrefsKey, useTabPrefs, writeTabPrefs } from './tabPrefs';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('preferências das abas (#134)', () => {
  it('chave por servidor e agente, escapada', () => {
    expect(tabPrefsKey('Meu App', 'a/b')).toBe('c3.chat.tabs/Meu%20App/a%2Fb');
  });
  it('lê o guardado, ignora lixo e mantém a referência enquanto não muda', () => {
    expect(readTabPrefs('k')).toEqual({ open: [], names: {} });
    localStorage.setItem('k', JSON.stringify({ open: ['a', 3, 'b'], names: { a: 'A' } }));
    const first = readTabPrefs('k');
    expect(first).toEqual({ open: ['a', 'b'], names: { a: 'A' } });
    expect(readTabPrefs('k')).toBe(first);
    localStorage.setItem('k', '{quebrado');
    expect(readTabPrefs('k')).toEqual({ open: [], names: {} });
    localStorage.setItem('k', JSON.stringify({ open: 'x', names: 'y' }));
    expect(readTabPrefs('k')).toEqual({ open: [], names: {} });
  });
  it('mudar avisa quem usa; outra janela avisa pelo evento storage', () => {
    const { result } = renderHook(() => useTabPrefs('c3.chat.tabs/app/conv'));
    act(() => result.current[1]((p) => ({ ...p, open: ['x'] })));
    expect(result.current[0].open).toEqual(['x']);
    act(() => {
      localStorage.setItem('c3.chat.tabs/app/conv', JSON.stringify({ open: ['y'], names: {} }));
      window.dispatchEvent(new StorageEvent('storage', { key: 'c3.chat.tabs/app/conv' }));
    });
    expect(result.current[0].open).toEqual(['y']);
    act(() => void window.dispatchEvent(new StorageEvent('storage', { key: 'outra' })));
    expect(result.current[0].open).toEqual(['y']);
  });
  it('sem armazenamento (cota, modo privado), vale na memória da sessão', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('cota');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    writeTabPrefs('m', { open: ['z'], names: {} });
    expect(readTabPrefs('m').open).toEqual(['z']);
    expect(readTabPrefs('nada')).toEqual({ open: [], names: {} });
  });
});
