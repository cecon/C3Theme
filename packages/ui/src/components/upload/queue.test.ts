import { describe, expect, it } from 'vitest';

import { nextToStart, uploadReducer, type UploadItem } from './queue';

const file = (name: string) => new File(['x'], name);

describe('fila de envio', () => {
  it('começa no máximo `concurrency` por vez', () => {
    let s: UploadItem[] = uploadReducer([], { type: 'add', items: ['a', 'b', 'c'].map((k) => ({ key: k, file: file(k) })) });
    expect(nextToStart(s, 2).map((i) => i.key)).toEqual(['a', 'b']);
    s = uploadReducer(s, { type: 'start', key: 'a' });
    s = uploadReducer(s, { type: 'start', key: 'b' });
    expect(nextToStart(s, 2)).toEqual([]);
    s = uploadReducer(s, { type: 'done', key: 'a', result: { id: '1', name: 'a', size: 1 } });
    expect(nextToStart(s, 2).map((i) => i.key)).toEqual(['c']);
  });

  it('progresso só anda para frente e só durante o envio', () => {
    let s: UploadItem[] = uploadReducer([], { type: 'add', items: [{ key: 'a', file: file('a') }] });
    s = uploadReducer(s, { type: 'progress', key: 'a', progress: 0.5 });
    expect(s[0].progress).toBe(0);
    s = uploadReducer(s, { type: 'start', key: 'a' });
    s = uploadReducer(s, { type: 'progress', key: 'a', progress: 0.5 });
    s = uploadReducer(s, { type: 'progress', key: 'a', progress: 0.4 });
    expect(s[0].progress).toBe(0.5);
  });

  it('erro guarda a mensagem e tentar de novo volta para a fila', () => {
    let s: UploadItem[] = uploadReducer([], { type: 'add', items: [{ key: 'a', file: file('a') }] });
    s = uploadReducer(uploadReducer(s, { type: 'start', key: 'a' }), { type: 'error', key: 'a', error: 'rede' });
    expect(s[0]).toMatchObject({ status: 'error', error: 'rede' });
    s = uploadReducer(s, { type: 'retry', key: 'a' });
    expect(s[0]).toMatchObject({ status: 'waiting', progress: 0, error: undefined });
  });
});
