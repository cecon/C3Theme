// #110: busca das configurações e atalho de teclado, sem React.
import { describe, expect, it } from 'vitest';

import { shortcutFromKey, shortcutLabel } from './shortcut.mjs';
import { fold, matchSettings, settingEntries } from './settingsSearch';
import type { EntityDef, Text } from './types';

const text = (t: Text | undefined, fallback = '') => (t === undefined ? fallback : typeof t === 'string' ? t : (t.defaultMessage ?? t.id));
const def = {
  name: 'p',
  fields: [
    {
      name: 'tema',
      type: 'enum',
      label: 'Aparência',
      help: 'Cores da tela',
      keywords: ['escuro', { id: 'k.modo', defaultMessage: 'Modo' }]
    },
    { name: 'som', type: 'boolean', label: 'Som' },
    { name: 'oculto', type: 'boolean', label: 'Oculto', denied: 'hidden' }
  ]
} as unknown as EntityDef;

describe('busca das configurações', () => {
  const entries = settingEntries(
    def,
    [
      { tab: 'Geral', rows: [['tema'], [{ field: 'som' }], ['nao_existe']] },
      { title: 'Privado', rows: [['oculto']] }
    ],
    text
  );

  it('um item por campo que existe e aparece, com a aba e o texto dobrado', () => {
    expect(entries.map((e) => [e.field, e.tab, e.where])).toEqual([
      ['tema', 'Geral', 'Geral'],
      ['som', 'Geral', 'Geral']
    ]);
    expect(entries[0].terms).toBe('aparencia cores da tela escuro modo');
  });

  it('cada palavra precisa aparecer; vazio não acha', () => {
    expect(matchSettings(entries, 'TELA  aparência').map((e) => e.field)).toEqual(['tema']);
    expect(matchSettings(entries, 'modo').map((e) => e.field)).toEqual(['tema']);
    expect(matchSettings(entries, 'som tela')).toEqual([]);
    expect(matchSettings(entries, '   ')).toEqual([]);
    expect(fold('Ação')).toBe('acao');
  });

  it('seção com título e sem aba mostra o título; sem nenhum, nada', () => {
    const e = settingEntries(def, [{ title: 'Áudio', rows: [['som']] }, { rows: [['tema']] }], text);
    expect(e.map((x) => [x.tab, x.where])).toEqual([
      [undefined, 'Áudio'],
      [undefined, undefined]
    ]);
  });
});

describe('atalho de teclado', () => {
  it('monta a forma canônica pelo code da tecla, na ordem dos modificadores', () => {
    expect(shortcutFromKey({ key: 'K', code: 'KeyK', shiftKey: true, ctrlKey: true })).toBe('Ctrl+Shift+K');
    expect(shortcutFromKey({ key: '!', code: 'Digit1', shiftKey: true, metaKey: true })).toBe('Shift+Meta+1');
    expect(shortcutFromKey({ key: 'ArrowUp', code: 'ArrowUp', altKey: true })).toBe('Alt+Up');
    expect(shortcutFromKey({ key: ' ', code: 'Space', ctrlKey: true })).toBe('Ctrl+Space');
    expect(shortcutFromKey({ key: 'F5', code: 'F5' })).toBe('F5');
    expect(shortcutFromKey({ key: '/', code: 'Slash', ctrlKey: true })).toBe('Ctrl+Slash');
    expect(shortcutFromKey({ key: 'x', ctrlKey: true })).toBe('Ctrl+X');
  });

  it('só modificador, letra sozinha ou Esc não viram atalho', () => {
    expect(shortcutFromKey({ key: 'Control', code: 'ControlLeft', ctrlKey: true })).toBeUndefined();
    expect(shortcutFromKey({ key: 'k', code: 'KeyK' })).toBeUndefined();
    expect(shortcutFromKey({ key: 'Escape', code: 'Escape', ctrlKey: true })).toBeUndefined();
  });

  it('no Mac mostra os símbolos', () => {
    expect(shortcutLabel('Ctrl+Alt+Shift+Meta+K', true)).toBe('⌃⌥⇧⌘K');
    expect(shortcutLabel('Ctrl+K')).toBe('Ctrl+K');
  });
});
