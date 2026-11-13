import { describe, expect, it, vi } from 'vitest';
import { matchesMessage, type ChatTransport, type Message } from '@c3theme/chat';
import { listPinned, rereadMessage } from './pinned';
import type { C3Client } from '../api';

const message: Message = { id: 'old', conversationId: 'a', direction: 'in', author: { id: 'bot', name: 'Bot' }, createdAt: '2026-01-01Z' };
describe('fixadas', () => {
  it('filtro compara todos os valores, com ausência=false, sem coerção nem propriedades herdadas', () => {
    expect(matchesMessage(message, { meta: { fixada: false } })).toBe(true);
    expect(matchesMessage(message, { meta: { fixada: true } })).toBe(false);
    expect(matchesMessage({ ...message, meta: { fixada: true, level: 2 } }, { meta: { fixada: true, level: 2 } })).toBe(true);
    expect(matchesMessage({ ...message, meta: { fixada: 1 } }, { meta: { fixada: true } })).toBe(false);
    expect(matchesMessage(message, { meta: { toString: false } })).toBe(true);
    expect(matchesMessage({ ...message, streaming: true }, { meta: { fixada: false } })).toBe(false);
  });
  it('usa a rota autenticada e preserva 404/401 como erros', async () => {
    const raw = vi
      .fn<NonNullable<C3Client['raw']>>()
      .mockResolvedValue({ status: 200, body: JSON.stringify({ data: [] }), contentType: 'application/json' });
    expect(await listPinned({ raw }, 'a b')).toEqual([]);
    expect(raw).toHaveBeenCalledWith('GET', '/_chat/a%20b/_pinned');
    for (const status of [404, 401, 500]) {
      raw.mockResolvedValue({ status, body: JSON.stringify({ error: { code: 'x', message: 'erro' } }), contentType: 'application/json' });
      await expect(listPinned({ raw }, 'a')).rejects.toMatchObject({ status, message: 'erro' });
    }
    await expect(listPinned({}, 'a')).rejects.toMatchObject({ status: 404 });
  });
  it('relê páginas até achar o meta atualizado, sem loop em cursor repetido ou histórico esgotado', async () => {
    const loadMessages = vi
      .fn<ChatTransport['loadMessages']>()
      .mockResolvedValueOnce({ messages: [{ ...message, id: 'new' }], hasMore: true })
      .mockResolvedValueOnce({ messages: [{ ...message, meta: { fixada: true } }], hasMore: false });
    expect(await rereadMessage({ loadMessages }, 'a', 'old')).toMatchObject({ meta: { fixada: true } });
    expect(loadMessages).toHaveBeenLastCalledWith('a', { before: 'new', limit: 30 });
    loadMessages.mockResolvedValue({ messages: [message], hasMore: true });
    expect(await rereadMessage({ loadMessages }, 'a', 'missing')).toBeUndefined();
    expect(loadMessages).toHaveBeenCalledTimes(4);
    loadMessages.mockResolvedValue({ messages: [], hasMore: false });
    expect(await rereadMessage({ loadMessages }, 'a', 'missing')).toBeUndefined();
    loadMessages.mockRejectedValue(new Error('rede'));
    await expect(rereadMessage({ loadMessages }, 'a', 'old')).rejects.toThrow('rede');
  });
});
