// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import {
  moverNaOrdem,
  ordenarServidores,
  posicaoDoAtalho,
  RAIL_PREFERENCES_PADRAO,
  readRailPreferences,
  writeRailPreferences
} from './preferences';

function memoria(inicial: Record<string, string> = {}) {
  const dados = new Map(Object.entries(inicial));
  return {
    getItem: (chave: string) => dados.get(chave) ?? null,
    setItem: (chave: string, valor: string) => dados.set(chave, valor),
    dados
  };
}

describe('preferências dos rails', () => {
  it('sem nada guardado, vale o padrão', () => {
    expect(readRailPreferences(memoria(), 'k')).toEqual(RAIL_PREFERENCES_PADRAO);
  });

  it('grava e relê ordem, oculto, fixadas e recolhido', () => {
    const storage = memoria();
    writeRailPreferences(storage, 'k', { serverOrder: ['s2', 's1'], localHidden: true, pinnedPages: ['/a'], pagesCollapsed: true });
    expect(readRailPreferences(storage, 'k')).toEqual({
      serverOrder: ['s2', 's1'],
      localHidden: true,
      pinnedPages: ['/a'],
      pagesCollapsed: true
    });
  });

  it('JSON inválido ou formato errado volta ao padrão', () => {
    expect(readRailPreferences(memoria({ k: 'não é json' }), 'k')).toEqual(RAIL_PREFERENCES_PADRAO);
    expect(readRailPreferences(memoria({ k: '{"serverOrder":"x","pinnedPages":3}' }), 'k')).toEqual(RAIL_PREFERENCES_PADRAO);
  });

  it('armazenamento que falha não derruba a casca', () => {
    const quebrado = {
      getItem: () => {
        throw new Error('modo privado');
      },
      setItem: () => {
        throw new Error('cota');
      }
    };
    expect(readRailPreferences(quebrado, 'k')).toEqual(RAIL_PREFERENCES_PADRAO);
    expect(() => writeRailPreferences(quebrado, 'k', RAIL_PREFERENCES_PADRAO)).not.toThrow();
  });
});

describe('ordem dos servidores', () => {
  const servidores = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('aplica a ordem guardada e mantém no fim quem não estava na lista', () => {
    expect(ordenarServidores(servidores, ['c', 'a']).map((s) => s.id)).toEqual(['c', 'a', 'b']);
    expect(ordenarServidores(servidores, ['x', 'b']).map((s) => s.id)).toEqual(['b', 'a', 'c']);
    expect(ordenarServidores(servidores, [])).toEqual(servidores);
  });

  it('move um item uma posição, sem sair da lista', () => {
    expect(moverNaOrdem(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c']);
    expect(moverNaOrdem(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'c', 'b']);
    expect(moverNaOrdem(['a', 'b', 'c'], 'a', -1)).toEqual(['a', 'b', 'c']);
    expect(moverNaOrdem(['a', 'b', 'c'], 'c', 1)).toEqual(['a', 'b', 'c']);
  });
});

describe('atalhos de 1 a 9', () => {
  function tecla(mudanca: Partial<KeyboardEvent> & { key: string }): KeyboardEvent {
    return {
      defaultPrevented: false,
      repeat: false,
      altKey: false,
      shiftKey: false,
      ctrlKey: true,
      metaKey: false,
      isComposing: false,
      target: null,
      ...mudanca
    } as unknown as KeyboardEvent;
  }

  it('devolve a posição com Ctrl no Windows e Cmd no macOS', () => {
    expect(posicaoDoAtalho(tecla({ key: '3' }), 'other')).toBe(2);
    expect(posicaoDoAtalho(tecla({ key: '1', ctrlKey: false, metaKey: true }), 'mac')).toBe(0);
    expect(posicaoDoAtalho(tecla({ key: '9' }), 'other')).toBe(8);
  });

  it('ignora repetição, composição, Alt, Shift, tecla errada e modificador trocado', () => {
    expect(posicaoDoAtalho(tecla({ key: '2', repeat: true }), 'other')).toBeUndefined();
    expect(posicaoDoAtalho(tecla({ key: '2', isComposing: true }), 'other')).toBeUndefined();
    expect(posicaoDoAtalho(tecla({ key: '2', altKey: true }), 'other')).toBeUndefined();
    expect(posicaoDoAtalho(tecla({ key: '2', shiftKey: true }), 'other')).toBeUndefined();
    expect(posicaoDoAtalho(tecla({ key: '0' }), 'other')).toBeUndefined();
    expect(posicaoDoAtalho(tecla({ key: 'a' }), 'other')).toBeUndefined();
    expect(posicaoDoAtalho(tecla({ key: '2', ctrlKey: false }), 'other')).toBeUndefined();
    expect(posicaoDoAtalho(tecla({ key: '2', ctrlKey: false, metaKey: true }), 'other')).toBeUndefined();
    expect(posicaoDoAtalho(tecla({ key: '2' }), 'mac')).toBeUndefined();
  });

  it('não rouba a tecla de campo de texto, área de texto, seleção ou conteúdo editável', () => {
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    const select = document.createElement('select');
    const div = document.createElement('div');
    div.setAttribute('contenteditable', 'true');
    for (const alvo of [input, textarea, select, div]) {
      expect(posicaoDoAtalho(tecla({ key: '2', target: alvo }), 'other')).toBeUndefined();
    }
    expect(posicaoDoAtalho(tecla({ key: '2', defaultPrevented: true }), 'other')).toBeUndefined();
  });
});
