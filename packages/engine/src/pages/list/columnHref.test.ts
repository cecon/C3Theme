// Coluna com endereço (#69): o link para outra tela montado pelos campos da linha.
import { describe, expect, it } from 'vitest';

import { hrefFields } from '../../hrefSlots.mjs';
import { fillHref, isAppPath } from './columnHref';

const kardex = '/estoque_movimentos?f.produto_id={produto_id}&f.almoxarifado_id={almoxarifado_id}';

describe('fillHref', () => {
  it('troca cada {campo} pelo valor da linha, codificado; reference vai pelo id', () => {
    expect(fillHref(kardex, { produto_id: 7, almoxarifado_id: { id: 'A 1', title: 'Central' } })).toBe(
      '/estoque_movimentos?f.produto_id=7&f.almoxarifado_id=A%201'
    );
    expect(fillHref('/produto', {})).toBe('/produto');
  });

  it('campo vazio, nulo ou ausente: sem link', () => {
    expect(fillHref(kardex, { produto_id: 7, almoxarifado_id: null })).toBeUndefined();
    expect(fillHref(kardex, { produto_id: '', almoxarifado_id: '1' })).toBeUndefined();
    expect(fillHref(kardex, { produto_id: 7 })).toBeUndefined();
    expect(fillHref(kardex, { produto_id: 0, almoxarifado_id: false })).toBe('/estoque_movimentos?f.produto_id=0&f.almoxarifado_id=false');
  });

  it('só caminho do próprio app', () => {
    expect(fillHref('https://fora.com/{id}', { id: '1' })).toBeUndefined();
    expect(fillHref('//fora.com/{id}', { id: '1' })).toBeUndefined();
    expect(isAppPath('/x')).toBe(true);
    expect(isAppPath('x')).toBe(false);
  });
});

describe('hrefFields', () => {
  it('os campos citados, na ordem', () => {
    expect(hrefFields(kardex)).toEqual(['produto_id', 'almoxarifado_id']);
    expect(hrefFields('/x')).toEqual([]);
  });
});
