// Lado do main: atende os pedidos que o preload manda por IPC e os entrega a um `C3Handler` (repasse a um backend
// HTTP, binário local ou um backend em processo). Recebe o `ipcMain` do app: não importa o Electron.

import { checkRequest, CHANNELS, type StreamEvent, type WireRequest, type WireResponse } from './wire';

/** Quem responde ao pedido. Devolve uma `Response` (do `fetch` do Node ou montada à mão). */
export type C3Handler = (req: WireRequest, signal: AbortSignal) => Promise<Response>;

/** O que o `ipcMain` entrega como evento: quem mandou e de qual frame. */
export interface IpcEventLike {
  sender: SenderLike;
  senderFrame?: { url: string } | null;
}

/** Quem pode pedir. O main só atende o que esta função aceitar (ex.: `fromPage(url do index.html)`). */
export type C3Caller = (event: IpcEventLike) => boolean;

export interface ServeOptions {
  /** Obrigatório: sem ele, qualquer página que o app abrir (até um site externo) usaria o backend. */
  allow: C3Caller;
}

/** Aceita só o frame que está na página `url` (a mesma, sem `#rota` nem `?busca`). */
export function fromPage(url: string): C3Caller {
  const page = bare(url);
  return (event) => !!event.senderFrame && bare(event.senderFrame.url) === page;
}

// sem `#rota` e `?busca`; a letra do drive no Windows (C: e c:) não diferencia a página
const bare = (url: string) => url.replace(/[?#].*$/, '').replace(/^file:\/\/\/([a-z]):/i, (_m, d: string) => `file:///${d.toLowerCase()}:`);

interface SenderLike {
  id: number;
  send(channel: string, ...args: unknown[]): void;
  isDestroyed?(): boolean;
}

/** O pedaço do `ipcMain` que o main usa. */
export interface IpcMainLike {
  handle(channel: string, listener: (event: any, ...args: any[]) => unknown): void;
  removeHandler(channel: string): void;
  on(channel: string, listener: (event: any, ...args: any[]) => void): unknown;
  removeListener(channel: string, listener: (...args: any[]) => void): unknown;
}

const DENIED = 'chamada de origem não autorizada';

const head = (res: Response) => ({ status: res.status, headers: [...res.headers] as [string, string][] });

async function whole(res: Response): Promise<WireResponse> {
  return { ...head(res), body: new Uint8Array(await res.arrayBuffer()) };
}

/** Liga os canais. Devolve a função que desliga (e cancela os fluxos abertos). */
export function serveC3(ipcMain: IpcMainLike, handler: C3Handler, { allow }: ServeOptions): () => void {
  const open = new Map<string, AbortController>();
  const keyOf = (sender: SenderLike, id: number) => `${sender.id}:${id}`;

  ipcMain.handle(CHANNELS.request, async (event: IpcEventLike, value: unknown) => {
    if (!allow(event)) throw new Error(DENIED);
    const ctrl = new AbortController();
    return whole(await handler(checkRequest(value), ctrl.signal));
  });

  const onStream = (event: IpcEventLike, id: number, value: unknown) => {
    const { sender } = event;
    const key = keyOf(sender, id);
    const emit = (e: StreamEvent) => {
      if (!sender.isDestroyed?.()) sender.send(CHANNELS.event, e);
    };
    if (!allow(event)) return emit({ id, type: 'error', message: DENIED });
    const ctrl = new AbortController();
    open.set(key, ctrl);
    (async () => {
      const res = await handler(checkRequest(value), ctrl.signal);
      emit({ id, type: 'head', head: head(res) });
      const reader = (res.body as ReadableStream<Uint8Array<ArrayBuffer>> | null)?.getReader();
      for (;;) {
        const chunk = await reader?.read();
        if (!chunk || chunk.done) break;
        emit({ id, type: 'chunk', chunk: chunk.value });
      }
      emit({ id, type: 'end' });
    })()
      .catch((e: Error) => {
        if (!ctrl.signal.aborted) emit({ id, type: 'error', message: e.message || 'falha no pedido' });
      })
      .finally(() => open.delete(key));
  };

  const onCancel = (event: IpcEventLike, id: number) => {
    open.get(keyOf(event.sender, id))?.abort();
  };

  ipcMain.on(CHANNELS.stream, onStream);
  ipcMain.on(CHANNELS.cancel, onCancel);
  return () => {
    ipcMain.removeHandler(CHANNELS.request);
    ipcMain.removeListener(CHANNELS.stream, onStream);
    ipcMain.removeListener(CHANNELS.cancel, onCancel);
    for (const ctrl of open.values()) ctrl.abort();
    open.clear();
  };
}
