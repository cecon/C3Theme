import { describe, expect, it } from 'vitest';

import { MAX_TEXT, checkConversation, checkId, parseAnswer, parseLimit, parseOutgoing, parseUiAnswer } from './chat-body';

// Mesmos casos do crates/c3-engine/src/chat_tests.rs.
const message = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as Error).message;
  }
  return 'passou';
};

describe('corpo do chat', () => {
  it('conversa e limite', () => {
    for (const ok of ['assistant', 'a', 'Conv_1-x', 'a'.repeat(64)]) expect(message(() => checkConversation(ok))).toBe('passou');
    for (const bad of ['', 'com espaço', 'a/b', 'ç', 'a'.repeat(65)])
      expect(message(() => checkConversation(bad))).toBe('Conversa inválida: use letras, números, _ ou -, até 64.');
    expect(parseLimit(undefined)).toBe(30);
    expect(parseLimit('1')).toBe(1);
    expect(parseLimit('100')).toBe(100);
    for (const bad of ['0', '101', 'x', '-1', '1.5'])
      expect(message(() => parseLimit(bad))).toBe('limit precisa ser um número de 1 a 100.');
    expect(message(() => checkId('m1', 'Mensagem'))).toBe('passou');
    expect(message(() => checkId('', 'Parte'))).toBe('Parte vazio.');
  });

  it('envio exige clientId e texto', () => {
    const part = { messageId: 'm1', partId: 'p1', kind: 'c3.form', version: 2 };
    expect(parseOutgoing({ clientId: 'c1', text: 'oi', replyTo: 'm0', pendingPart: part })).toEqual({
      clientId: 'c1',
      text: 'oi',
      replyTo: 'm0',
      pendingPart: part
    });
    expect(parseOutgoing({ clientId: 'c1', text: 'oi', replyTo: null, pendingPart: null })).toEqual({ clientId: 'c1', text: 'oi' });
    expect(message(() => parseOutgoing({ text: 'oi' }))).toBe('clientId é obrigatório.');
    expect(message(() => parseOutgoing({ clientId: 'c1' }))).toBe('text é obrigatório.');
    expect(message(() => parseOutgoing({ clientId: 'c1', text: '' }))).toBe('text precisa ser texto de 1 a 20000 caracteres.');
    expect(message(() => parseOutgoing({ clientId: 'c1', text: 1 }))).toBe('text precisa ser texto de 1 a 20000 caracteres.');
    expect(message(() => parseOutgoing({ clientId: 'c1', text: 'x'.repeat(MAX_TEXT) }))).toBe('passou');
    expect(message(() => parseOutgoing({ clientId: 'c1', text: 'x'.repeat(MAX_TEXT + 1) }))).not.toBe('passou');
    expect(message(() => parseOutgoing({ clientId: 'x'.repeat(101), text: 'oi' }))).toBe(
      'clientId precisa ser texto de 1 a 100 caracteres.'
    );
    expect(message(() => parseOutgoing({ clientId: 'c1', text: 'oi', files: [] }))).toBe("'files' não vale no envio.");
    for (const bad of [{ messageId: 'm1', partId: 'p1' }, 'p1', { messageId: 'm1', partId: 'p1', kind: 1 }])
      expect(message(() => parseOutgoing({ clientId: 'c1', text: 'oi', pendingPart: bad }))).toBe(
        'pendingPart precisa de messageId, partId e kind.'
      );
  });

  it('resposta de pergunta e de parte', () => {
    const a = { optionIds: ['a'], text: 'x', dismissed: false };
    expect(parseAnswer(a)).toBe(a);
    expect(parseAnswer({})).toEqual({});
    for (const bad of [{ optionIds: [1] }, { optionIds: 'a' }, { text: 1 }, { dismissed: 'sim' }, { outro: 1 }])
      expect(message(() => parseAnswer(bad))).toBe('Resposta precisa ser { optionIds?, text?, dismissed? }.');
    for (const action of ['accept', 'decline', 'cancel', 'undo']) {
      const ok = { action, values: {}, version: 3, reason: 'r' };
      expect(parseUiAnswer(ok)).toBe(ok);
    }
    expect(message(() => parseUiAnswer({}))).toBe('action precisa ser accept, decline, cancel ou undo.');
    expect(message(() => parseUiAnswer({ action: 'talvez' }))).toBe('action precisa ser accept, decline, cancel ou undo.');
    for (const bad of [{ values: [] }, { version: '1' }, { version: -1 }, { version: 1.5 }, { reason: 1 }])
      expect(message(() => parseUiAnswer({ action: 'accept', ...bad }))).toBe('values precisa ser objeto, version número e reason texto.');
  });
});
