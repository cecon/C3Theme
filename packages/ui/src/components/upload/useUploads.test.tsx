// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { UploadContext, Uploader } from './types';
import useUploads from './useUploads';

/** Envio controlado pelo teste: cada arquivo fica pendente até `finish`/`fail`. */
function fakeUploader() {
  const pending = new Map<string, { ctx: UploadContext; resolve: (v: any) => void; reject: (e: Error) => void }>();
  const upload: Uploader = (file, ctx) =>
    new Promise((resolve, reject) => {
      pending.set(file.name, { ctx, resolve, reject });
      ctx.signal.addEventListener('abort', () => reject(new Error('abort')));
    });
  return {
    upload,
    pending,
    finish: (name: string) => pending.get(name)!.resolve({ id: name, name, size: 1 }),
    fail: (name: string) => pending.get(name)!.reject(new Error('rede'))
  };
}

describe('useUploads', () => {
  it('sobe com limite de concorrência, informa progresso e chama onDone', async () => {
    const f = fakeUploader();
    const onDone = vi.fn();
    const { result } = renderHook(() => useUploads(f.upload, { concurrency: 1, onDone }));
    act(() => void result.current.add([new File(['a'], 'a.pdf'), new File(['b'], 'b.pdf')]));
    await waitFor(() => expect(f.pending.size).toBe(1));
    act(() => f.pending.get('a.pdf')!.ctx.onProgress(0.4));
    expect(result.current.items[0]).toMatchObject({ status: 'uploading', progress: 0.4 });
    expect(result.current.items[1].status).toBe('waiting');
    await act(async () => f.finish('a.pdf'));
    expect(onDone).toHaveBeenCalledWith({ id: 'a.pdf', name: 'a.pdf', size: 1 }, expect.any(String));
    await waitFor(() => expect(f.pending.size).toBe(2));
  });

  it('cancelar tira da lista; falha guarda o erro e retry tenta de novo', async () => {
    const f = fakeUploader();
    const { result } = renderHook(() => useUploads(f.upload));
    act(() => void result.current.add([new File(['a'], 'a.pdf'), new File(['b'], 'b.pdf')]));
    await waitFor(() => expect(f.pending.size).toBe(2));
    const [a, b] = result.current.items.map((i) => i.key);
    await act(async () => result.current.cancel(a));
    await waitFor(() => expect(result.current.items.map((i) => i.key)).toEqual([b]));
    await act(async () => f.fail('b.pdf'));
    expect(result.current.items[0]).toMatchObject({ status: 'error', error: 'rede' });
    f.pending.clear();
    act(() => result.current.retry(b));
    await waitFor(() => expect(f.pending.has('b.pdf')).toBe(true));
  });
});
