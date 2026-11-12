import { describe, expect, it } from 'vitest';

import { composerKey, isSteering, splitSteering, type ComposerKeyState, type KeyPress } from './steer';
import type { Message } from './types';

const press = (key: string, more: Partial<KeyPress> = {}): KeyPress => ({ key, shift: false, mod: false, composing: false, ...more });
const state = (more: Partial<ComposerKeyState> = {}): ComposerKeyState => ({
  sendKey: 'enter',
  busy: false,
  canSteer: true,
  canStop: true,
  ...more
});

describe('composerKey', () => {
  it('modo Enter: Enter envia, Shift+Enter quebra a linha, Ctrl+Enter envia sem turno', () => {
    expect(composerKey(press('Enter'), state())).toBe('send');
    expect(composerKey(press('Enter', { shift: true }), state())).toBe('none');
    expect(composerKey(press('Enter', { mod: true }), state())).toBe('send');
  });

  it('modo Ctrl+Enter: Enter quebra a linha e Ctrl+Enter envia', () => {
    expect(composerKey(press('Enter'), state({ sendKey: 'modEnter' }))).toBe('none');
    expect(composerKey(press('Enter', { mod: true }), state({ sendKey: 'modEnter' }))).toBe('send');
    expect(composerKey(press('Enter', { mod: true, shift: true }), state({ sendKey: 'modEnter' }))).toBe('none');
  });

  it('com turno em andamento, Ctrl+Enter orienta nos dois modos; Enter continua pondo na fila', () => {
    expect(composerKey(press('Enter', { mod: true }), state({ busy: true }))).toBe('steer');
    expect(composerKey(press('Enter', { mod: true }), state({ busy: true, sendKey: 'modEnter' }))).toBe('steer');
    expect(composerKey(press('Enter'), state({ busy: true }))).toBe('send');
  });

  it('sem orientar ligado, Ctrl+Enter com turno envia (fila)', () => {
    expect(composerKey(press('Enter', { mod: true }), state({ busy: true, canSteer: false }))).toBe('send');
  });

  it('Esc para só com turno e Parar; compondo acento, nada; outra tecla, nada', () => {
    expect(composerKey(press('Escape'), state({ busy: true }))).toBe('stop');
    expect(composerKey(press('Escape'), state({ busy: false }))).toBe('none');
    expect(composerKey(press('Escape'), state({ busy: true, canStop: false }))).toBe('none');
    expect(composerKey(press('Enter', { composing: true }), state())).toBe('none');
    expect(composerKey(press('Escape', { composing: true }), state({ busy: true }))).toBe('none');
    expect(composerKey(press('a'), state())).toBe('none');
    expect(composerKey(press('a', { mod: true }), state({ busy: true }))).toBe('none');
  });
});

const msg = (id: string, more: Partial<Message> = {}): Message => ({
  id,
  conversationId: 'c1',
  author: { id: 'me', name: 'Eu' },
  direction: 'out',
  text: id,
  createdAt: '2026-11-12T10:00:00Z',
  ...more
});

describe('orientações esperando', () => {
  it('só a minha com steer pending espera o agente', () => {
    expect(isSteering(msg('a', { steer: 'pending' }))).toBe(true);
    expect(isSteering(msg('b', { steer: 'taken' }))).toBe(false);
    expect(isSteering(msg('c'))).toBe(false);
    expect(isSteering(msg('d', { steer: 'pending', direction: 'in' }))).toBe(false);
  });

  it('separa a fila da conversa; sem nenhuma, devolve a mesma lista', () => {
    const list = [msg('a'), msg('b', { steer: 'pending' }), msg('c', { steer: 'taken' })];
    const { shown, steering } = splitSteering(list);
    expect(shown.map((m) => m.id)).toEqual(['a', 'c']);
    expect(steering.map((m) => m.id)).toEqual(['b']);
    const plain = [msg('a')];
    expect(splitSteering(plain).shown).toBe(plain);
    expect(splitSteering(plain).steering).toEqual([]);
  });
});
