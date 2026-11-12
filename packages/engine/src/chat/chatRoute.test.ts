// A conversa da rota (#100, ADR 0009): a regra que a shell e o `pnpm spec:check` dividem.
import { describe, expect, it } from 'vitest';

import { CONVERSATION_ID, conversationIssue, conversationParam, routeParams } from './chatRoute.mjs';

describe('chatRoute', () => {
  it('routeParams lista os :nome da rota, na ordem', () => {
    expect(routeParams('/agente/:agent/conversa/:conversation')).toEqual(['agent', 'conversation']);
    expect(routeParams('/assistente')).toEqual([]);
    expect(routeParams(undefined)).toEqual([]);
  });

  it('conversationParam: {nome} pede o parâmetro; ausente só com :conversation; id fixo nunca', () => {
    expect(conversationParam('{id}', '/c/:id')).toBe('id');
    expect(conversationParam('{id}', '/c')).toBe('id');
    expect(conversationParam(undefined, '/c/:conversation')).toBe('conversation');
    expect(conversationParam(undefined, '/c/:id')).toBeNull();
    expect(conversationParam(undefined, undefined)).toBeNull();
    expect(conversationParam('assistant', '/c/:conversation')).toBeNull();
    expect(conversationParam('{Id}', '/c/:Id')).toBeNull();
    expect(conversationParam('x{id}', '/c/:id')).toBeNull();
    expect(conversationParam('{id}x', '/c/:id')).toBeNull();
  });

  it('conversationIssue recusa {nome} sem :nome na rota e fora de página', () => {
    expect(conversationIssue('{id}', '/c/:id')).toBeNull();
    expect(conversationIssue('{id}', '/c/:conversation')).toBe("'{id}' sem ':id' na rota '/c/:conversation'");
    expect(conversationIssue('{id}', undefined)).toBe("'{id}' só vale em página, com ':id' na rota");
    expect(conversationIssue('assistant', undefined)).toBeNull();
    expect(conversationIssue(undefined, '/c')).toBeNull();
  });

  it('CONVERSATION_ID é o id das rotas /_chat', () => {
    expect(CONVERSATION_ID.test('pedido_1-a')).toBe(true);
    expect(CONVERSATION_ID.test('')).toBe(false);
    expect(CONVERSATION_ID.test('a/b')).toBe(false);
    expect(CONVERSATION_ID.test('x'.repeat(65))).toBe(false);
  });
});
