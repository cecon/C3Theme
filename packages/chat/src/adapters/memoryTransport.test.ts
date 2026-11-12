import { describe, expect, it } from 'vitest';

import type { ChatEvent } from '../core/transport';
import { memoryTransport } from './memoryTransport';

describe('memoryTransport: orientar', () => {
  it('a orientação volta pending e só ela pode ser removida (avisa quem assina)', async () => {
    const { transport, store } = memoryTransport();
    const events: ChatEvent[] = [];
    transport.subscribe('c1', (e) => events.push(e));
    const steer = await transport.send({ clientId: 'a', conversationId: 'c1', text: 'vá', steer: true });
    const plain = await transport.send({ clientId: 'b', conversationId: 'c1', text: 'oi' });
    expect(steer.steer).toBe('pending');
    expect(plain.steer).toBeUndefined();
    await expect(transport.remove!('c1', plain.id)).rejects.toMatchObject({ status: 409 });
    await expect(transport.remove!('c2', steer.id)).rejects.toMatchObject({ status: 409 });
    await transport.remove!('c1', steer.id);
    expect(store.map((m) => m.id)).toEqual([plain.id]);
    expect(events.at(-1)).toEqual({ type: 'removed', conversationId: 'c1', id: steer.id });
  });
});
