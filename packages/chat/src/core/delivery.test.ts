import { describe, expect, it } from 'vitest';
import { isDeliveryMessage, withLastDelivery } from './delivery';
import type { Message } from './types';

const message = (extra: Partial<Message> = {}): Message => ({
  id: 'a',
  conversationId: 'c',
  author: { id: 'agent', name: 'Agente', kind: 'agent' },
  direction: 'in',
  createdAt: '2026-11-12T12:00:00Z',
  ...extra
});

describe('entrega da última resposta', () => {
  it('sem resumo mantém mensagens e a entrega explícita; uma lista vazia não ganha mensagem', () => {
    const messages = [message({ entrega: { situacao: 'lida' } })];
    expect(withLastDelivery(messages)).toBe(messages);
    expect(withLastDelivery([], { situacao: 'enviada' })).toEqual([]);
    expect(withLastDelivery(messages, { situacao: 'enviada' })).toBe(messages);
  });

  it('ignora pessoas, perguntas, avisos e handoffs ao localizar a última resposta', () => {
    const messages = [
      message({ id: 'old' }),
      message({ id: 'last', author: { id: 'legacy', name: 'Legado' } }),
      message({ id: 'question', direction: 'out' }),
      message({ id: 'person', author: { id: 'p', name: 'Pessoa', kind: 'person' } }),
      message({ id: 'system', kind: 'system' }),
      message({ id: 'handoff', kind: 'handoff' })
    ];
    const delivery = { situacao: 'falhou' as const, motivo: 'Destino indisponível' };
    const result = withLastDelivery(messages, delivery);
    expect(result[1].entrega).toEqual(delivery);
    expect(result.filter((m) => m.entrega)).toHaveLength(1);
    expect(messages.every((m) => !m.entrega)).toBe(true);
    expect(result[0]).toBe(messages[0]);
    expect(messages.slice(2).every((m) => !isDeliveryMessage(m))).toBe(true);
    expect(withLastDelivery(messages.slice(2), delivery)).toEqual(messages.slice(2));
  });
});
