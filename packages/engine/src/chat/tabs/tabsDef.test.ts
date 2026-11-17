// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import type { WireLane } from '../../agent/lanes';
import { isDraft, laneState, laneTab, shortcutAction } from './tabsDef';

const lane: WireLane = { id: 'l', title: 'Título', kind: 'aside', parentId: 'p', unread: 0, updatedAt: '2026-11-17T00:00:00Z' };

describe('abas: da thread para a aba (#134)', () => {
  it('estado com prioridade: falha, aguardando, executando, resposta nova', () => {
    expect(laneState(lane)).toBeUndefined();
    expect(laneState({ ...lane, unread: 2 })).toBe('unread');
    expect(laneState({ ...lane, unread: 2, working: true })).toBe('running');
    expect(laneState({ ...lane, working: true, attention: 'approval' })).toBe('waiting');
    expect(laneState({ ...lane, attention: 'question', failed: true })).toBe('failed');
  });
  it('nome dado pela pessoa ganha do título; indisponível vira aba desabilitada', () => {
    expect(laneTab(lane, {})).toEqual({ id: 'l', label: 'Título', state: undefined });
    expect(laneTab(lane, { l: 'Meu nome' }).label).toBe('Meu nome');
    expect(laneTab(lane, { toString: 'x' } as never).label).toBe('Título');
    expect(laneTab({ ...lane, unavailable: 'arquivada' }, {}).disabled).toBe('arquivada');
  });
  it('rascunho tem prefixo próprio', () => {
    expect(isDraft('c3:draft:1')).toBe(true);
    expect(isDraft('l')).toBe(false);
  });
});

describe('atalhos das abas (#134)', () => {
  const shortcuts = { next: 'Ctrl+Tab', close: 'Alt+W' };
  it('acha a ação do atalho apertado', () => {
    expect(shortcutAction(shortcuts, 'Ctrl+Tab', document.body, false)).toBe('next');
    expect(shortcutAction(shortcuts, 'Alt+W', null, false)).toBe('close');
    expect(shortcutAction(shortcuts, 'Alt+X', document.body, false)).toBeUndefined();
  });
  it('não dispara sem atalhos, sem tecla, em composição nem em campo de texto', () => {
    expect(shortcutAction(undefined, 'Ctrl+Tab', null, false)).toBeUndefined();
    expect(shortcutAction(shortcuts, undefined, null, false)).toBeUndefined();
    expect(shortcutAction(shortcuts, 'Ctrl+Tab', null, true)).toBeUndefined();
    for (const tag of ['input', 'textarea', 'select'])
      expect(shortcutAction(shortcuts, 'Ctrl+Tab', document.createElement(tag), false)).toBeUndefined();
    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    Object.defineProperty(editable, 'isContentEditable', { value: true });
    expect(shortcutAction(shortcuts, 'Ctrl+Tab', editable, false)).toBeUndefined();
  });
});
