// Adaptador do preload: expõe ao renderer a ponte `C3Bridge` (`window.c3`) sobre o IPC do Electron. Recebe o
// `contextBridge` e o `ipcRenderer` do próprio app, então funciona com preload em sandbox (empacotado junto) e
// não importa o Electron.

import { CHANNELS, type C3Bridge, type StreamEvent, type WireRequest, type WireResponse } from './wire';

/** O pedaço do `ipcRenderer` que a ponte usa. */
export interface IpcRendererLike {
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
  send(channel: string, ...args: unknown[]): void;
  on(channel: string, listener: (event: unknown, ...args: any[]) => void): unknown;
}

export interface ContextBridgeLike {
  exposeInMainWorld(key: string, api: unknown): void;
}

/** A ponte em si (sem expor): útil em teste e para quem monta o próprio `window.*`. */
export function createC3Bridge(ipc: IpcRendererLike): C3Bridge {
  const open = new Map<number, (e: StreamEvent) => void>();
  let next = 1;
  ipc.on(CHANNELS.event, (_event, e: StreamEvent) => {
    open.get(e.id)?.(e);
    if (e.type === 'end' || e.type === 'error') open.delete(e.id);
  });
  return {
    request: (req: WireRequest) => ipc.invoke(CHANNELS.request, req) as Promise<WireResponse>,
    stream(req, onEvent) {
      const id = next++;
      open.set(id, onEvent);
      ipc.send(CHANNELS.stream, id, req);
      return () => {
        if (open.delete(id)) ipc.send(CHANNELS.cancel, id);
      };
    }
  };
}

/** No preload: `exposeC3Bridge(contextBridge, ipcRenderer)` e, no renderer, `ipcFetch(window.c3)`. */
export function exposeC3Bridge(contextBridge: ContextBridgeLike, ipc: IpcRendererLike, key = 'c3'): void {
  contextBridge.exposeInMainWorld(key, createC3Bridge(ipc));
}
