import { useCallback, useEffect, useReducer, useRef } from 'react';

import { nextToStart, uploadReducer } from './queue';
import type { UploadedFile, Uploader } from './types';

let seq = 0;

/**
 * Fila de envio com progresso: `add` põe arquivos na fila, até `concurrency` sobem juntos, `cancel` aborta,
 * `retry` tenta de novo o que falhou. Cada um que termina chama `onDone`. Sair da tela cancela o que estiver subindo.
 */
export default function useUploads(
  upload: Uploader,
  { concurrency = 3, onDone }: { concurrency?: number; onDone?: (file: UploadedFile, key: string) => void } = {}
) {
  const [items, dispatch] = useReducer(uploadReducer, []);
  const controllers = useRef(new Map<string, AbortController>());
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    for (const item of nextToStart(items, concurrency)) {
      const ctrl = new AbortController();
      controllers.current.set(item.key, ctrl);
      dispatch({ type: 'start', key: item.key });
      upload(item.file, { signal: ctrl.signal, onProgress: (progress) => dispatch({ type: 'progress', key: item.key, progress }) })
        .then((result) => {
          dispatch({ type: 'done', key: item.key, result });
          done.current?.(result, item.key);
        })
        .catch((e: unknown) => {
          if (ctrl.signal.aborted) return dispatch({ type: 'remove', key: item.key });
          dispatch({ type: 'error', key: item.key, error: e instanceof Error ? e.message : String(e) });
        })
        .finally(() => controllers.current.delete(item.key));
    }
  }, [items, concurrency, upload]);

  useEffect(() => {
    const running = controllers.current;
    return () => running.forEach((c) => c.abort());
  }, []);

  const add = useCallback((files: File[]) => {
    const added = files.map((file) => ({ key: `u${++seq}`, file }));
    dispatch({ type: 'add', items: added });
    return added.map((a) => a.key);
  }, []);

  const cancel = useCallback((key: string) => {
    const ctrl = controllers.current.get(key);
    if (ctrl) ctrl.abort();
    else dispatch({ type: 'remove', key });
  }, []);

  const retry = useCallback((key: string) => dispatch({ type: 'retry', key }), []);
  const remove = useCallback((key: string) => dispatch({ type: 'remove', key }), []);

  return { items, add, cancel, retry, remove };
}
