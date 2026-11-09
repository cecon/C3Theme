import { describe, expect, it } from 'vitest';

import { parseSse, readSse, toMessage, type LiveMessage } from './sse';

describe('parseSse', () => {
  it('separa os eventos completos do pedaço que ainda está chegando', () => {
    const { events, rest } = parseSse('event: ready\ndata: {}\n\n:\n\nevent: change\ndata: {"change":"crea');
    expect(events).toEqual([{ event: 'ready', data: '{}' }]);
    expect(rest).toBe('event: change\ndata: {"change":"crea');
  });

  it('aceita CRLF e junta várias linhas de data', () => {
    const { events } = parseSse('event: change\r\ndata: a\r\ndata: b\r\n\r\n');
    expect(events).toEqual([{ event: 'change', data: 'a\nb' }]);
  });
});

describe('toMessage', () => {
  it('traduz ready e change; ignora o resto', () => {
    expect(toMessage({ event: 'ready', data: '{}' })).toEqual({ type: 'ready' });
    expect(toMessage({ event: 'change', data: '{"change":"created","id":"7"}' })).toEqual({
      type: 'change',
      change: 'created',
      id: '7'
    });
    expect(toMessage({ event: 'change', data: '{"change":"changed","id":null}' })).toEqual({
      type: 'change',
      change: 'changed',
      id: null
    });
    expect(toMessage({ event: 'change', data: 'quebrado' })).toBeNull();
    expect(toMessage({ event: 'outro', data: '{}' })).toBeNull();
  });
});

describe('readSse', () => {
  it('lê o corpo em pedaços quebrados no meio do evento', async () => {
    const parts = ['event: ready\nda', 'ta: {}\n\nevent: change\ndata: {"change":"deleted","id":"3"}\n', '\n'];
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        for (const p of parts) c.enqueue(new TextEncoder().encode(p));
        c.close();
      }
    });
    const got: LiveMessage[] = [];
    await readSse(body, (m) => got.push(m));
    expect(got).toEqual([{ type: 'ready' }, { type: 'change', change: 'deleted', id: '3' }]);
  });
});
