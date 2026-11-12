import { describe, expect, it } from 'vitest';

import { actionsFor, matchesMessage, messagesUntil, sortLanes, workingCount, type Lane, type MessageAction } from './lanes';
import type { Message } from './types';

const msg = (id: string, extra: Partial<Message> = {}): Message => ({
  id,
  conversationId: 'c',
  author: { id: 'bot', name: 'Bot' },
  direction: 'in',
  createdAt: '2026-11-12T10:00:00Z',
  ...extra
});
const lane = (id: string, updatedAt: string, working?: boolean): Lane => ({
  id,
  title: id,
  unread: 0,
  updatedAt,
  kind: 'aside',
  parentId: 'c',
  working
});

describe('matchesMessage', () => {
  it('sem filtro: qualquer mensagem de texto', () => {
    expect(matchesMessage(msg('1'))).toBe(true);
    expect(matchesMessage(msg('1', { direction: 'out' }))).toBe(true);
  });
  it('sistema, passagem e resposta chegando não têm ações', () => {
    expect(matchesMessage(msg('1', { kind: 'system' }))).toBe(false);
    expect(matchesMessage(msg('1', { kind: 'handoff' }))).toBe(false);
    expect(matchesMessage(msg('1', { streaming: true }))).toBe(false);
    expect(matchesMessage(msg('1', { kind: 'text' }))).toBe(true);
  });
  it('direção', () => {
    expect(matchesMessage(msg('1'), { direction: 'in' })).toBe(true);
    expect(matchesMessage(msg('1'), { direction: 'out' })).toBe(false);
    expect(matchesMessage(msg('1', { direction: 'out' }), { direction: 'out' })).toBe(true);
  });
  it('autor: sem kind, quem chega é agente e quem sai é gente', () => {
    expect(matchesMessage(msg('1'), { author: 'agent' })).toBe(true);
    expect(matchesMessage(msg('1'), { author: 'person' })).toBe(false);
    expect(matchesMessage(msg('1', { direction: 'out' }), { author: 'person' })).toBe(true);
    expect(matchesMessage(msg('1', { direction: 'out' }), { author: 'agent' })).toBe(false);
  });
  it('autor: o kind declarado vale mais que a direção', () => {
    const ana = msg('1', { author: { id: 'ana', name: 'Ana', kind: 'person' } });
    expect(matchesMessage(ana, { author: 'person' })).toBe(true);
    expect(matchesMessage(ana, { author: 'agent' })).toBe(false);
  });
});

describe('actionsFor', () => {
  const actions: MessageAction[] = [
    { id: 'ramo', label: 'Ramificar daqui', when: { direction: 'in' }, opens: 'branch' },
    { id: 'fixar', label: 'Fixar' }
  ];
  it('filtra na ordem declarada', () => {
    expect(actionsFor(msg('1'), actions).map((a) => a.id)).toEqual(['ramo', 'fixar']);
    expect(actionsFor(msg('1', { direction: 'out' }), actions).map((a) => a.id)).toEqual(['fixar']);
  });
  it('mensagem enviando ou que falhou não tem ações', () => {
    expect(actionsFor(msg('1', { status: 'sending' }), actions)).toEqual([]);
    expect(actionsFor(msg('1', { status: 'failed' }), actions)).toEqual([]);
    expect(actionsFor(msg('1', { status: 'sent' }), actions)).toHaveLength(2);
  });
  it('sem ações', () => {
    expect(actionsFor(msg('1'))).toEqual([]);
  });
});

describe('messagesUntil', () => {
  const list = [msg('1'), msg('2'), msg('3')];
  it('até a mensagem, inclusive', () => {
    expect(messagesUntil(list, '2').map((m) => m.id)).toEqual(['1', '2']);
    expect(messagesUntil(list, '1').map((m) => m.id)).toEqual(['1']);
  });
  it('mensagem fora da lista: vazio', () => {
    expect(messagesUntil(list, 'x')).toEqual([]);
  });
});

describe('sortLanes', () => {
  it('trabalhando em cima, depois a mais recente', () => {
    const lanes = [lane('a', '2026-11-12T10:00:00Z'), lane('b', '2026-11-12T11:00:00Z'), lane('c', '2026-11-12T09:00:00Z', true)];
    expect(sortLanes(lanes).map((l) => l.id)).toEqual(['c', 'b', 'a']);
  });
  it('não muda a lista recebida', () => {
    const lanes = [lane('a', '2026-11-12T10:00:00Z'), lane('b', '2026-11-12T11:00:00Z')];
    sortLanes(lanes);
    expect(lanes.map((l) => l.id)).toEqual(['a', 'b']);
  });
  it('duas trabalhando: a mais recente primeiro', () => {
    const lanes = [lane('a', '2026-11-12T10:00:00Z', true), lane('b', '2026-11-12T11:00:00Z', true)];
    expect(sortLanes(lanes).map((l) => l.id)).toEqual(['b', 'a']);
  });
});

describe('workingCount', () => {
  it('conta as que trabalham', () => {
    expect(workingCount([lane('a', 'x', true), lane('b', 'x'), lane('c', 'x', true)])).toBe(2);
    expect(workingCount([])).toBe(0);
  });
});
