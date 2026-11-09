// Adaptador do renderer para a porta de transporte do motor (`C3Fetch` de @c3theme/engine): o pedido vai por IPC
// ao processo main e volta como `Response`, então o cliente do motor não muda. Sem Electron.

import type { C3Bridge, WireHead, WireRequest } from './wire';

export type { C3Bridge } from './wire';

/** Status que não podem ter corpo numa `Response`. */
const NO_BODY = new Set([101, 204, 205, 304]);

/**
 * `fetch` que fala com o main pela ponte do preload. A URL é o caminho da API (use `apiUrl=""` no `<C3Shell>`):
 * quem sabe o endereço do backend é o main. Com `signal` (tempo real), o corpo chega em fluxo e abortar cancela.
 */
export function ipcFetch(bridge: C3Bridge): (url: string, init?: RequestInit) => Promise<Response> {
  return async (url, init = {}) => {
    const req = toWire(url, init);
    if (!init.signal) {
      const res = await bridge.request(req);
      return toResponse(res, NO_BODY.has(res.status) ? null : res.body);
    }
    return streamed(bridge, req, init.signal);
  };
}

function toWire(url: string, init: RequestInit): WireRequest {
  if (init.body != null && typeof init.body !== 'string') throw new TypeError('ipcFetch: só corpo em texto (JSON)');
  const path = url.startsWith('/') ? url : `/${url}`;
  const headers = Object.fromEntries(new Headers(init.headers ?? {}));
  return { method: (init.method ?? 'GET').toUpperCase(), path, headers, ...(init.body != null && { body: init.body }) };
}

const toResponse = (head: WireHead, body: BodyInit | null) => new Response(body, { status: head.status, headers: head.headers });

const abortError = () => new DOMException('O pedido foi cancelado.', 'AbortError');

function streamed(bridge: C3Bridge, req: WireRequest, signal: AbortSignal): Promise<Response> {
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    let body: ReadableStreamDefaultController<Uint8Array<ArrayBuffer>> | undefined;
    let started = false;
    let done = false;
    // a ponte pode responder já dentro de `stream` (ex.: origem recusada): tudo abaixo existe antes de chamá-la
    let cancel = () => {};
    const onAbort = () => {
      stop();
      close(() => (started ? body?.error(abortError()) : reject(abortError())));
    };
    function stop() {
      signal.removeEventListener('abort', onAbort);
      cancel();
    }
    function close(fn: () => void) {
      done = true;
      signal.removeEventListener('abort', onAbort);
      try {
        fn();
      } catch {
        /* fluxo já fechado pelo leitor */
      }
    }
    signal.addEventListener('abort', onAbort);
    const stopStream = bridge.stream(req, (e) => {
      if (e.type === 'head') {
        started = true;
        const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({ start: (c) => void (body = c), cancel: () => stop() });
        resolve(toResponse(e.head, NO_BODY.has(e.head.status) ? null : stream));
      } else if (e.type === 'chunk') body?.enqueue(e.chunk);
      else if (e.type === 'end') close(() => body?.close());
      else close(() => (started ? body?.error(new TypeError(e.message)) : reject(new TypeError(e.message))));
    });
    cancel = stopStream;
    if (done) stopStream();
  });
}
