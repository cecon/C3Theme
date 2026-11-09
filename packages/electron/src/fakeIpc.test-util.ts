// IPC em memória para os testes: um ipcMain e um ipcRenderer ligados, com structured clone como no Electron.

import type { IpcMainLike } from './serve';
import type { IpcRendererLike } from './preload';

type Listener = (event: any, ...args: any[]) => void;

export function fakeIpc(frameUrl: string | null = 'file:///app/dist/index.html#/clientes') {
  const handlers = new Map<string, (event: any, ...args: any[]) => unknown>();
  const mainOn = new Map<string, Set<Listener>>();
  const rendererOn = new Map<string, Set<Listener>>();
  const sender = { id: 7, send: (ch: string, ...args: unknown[]) => rendererOn.get(ch)?.forEach((l) => l({}, ...structuredClone(args))) };
  const event = { sender, senderFrame: frameUrl === null ? null : { url: frameUrl } };
  const add = (m: Map<string, Set<Listener>>, ch: string, l: Listener) => m.set(ch, (m.get(ch) ?? new Set()).add(l));

  const ipcMain: IpcMainLike = {
    handle: (ch, l) => void handlers.set(ch, l),
    removeHandler: (ch) => void handlers.delete(ch),
    on: (ch, l) => add(mainOn, ch, l),
    removeListener: (ch, l) => mainOn.get(ch)?.delete(l)
  };
  const ipcRenderer: IpcRendererLike = {
    invoke: async (ch, ...args) => {
      const h = handlers.get(ch);
      if (!h) throw new Error(`sem handler para ${ch}`);
      return structuredClone(await h(event, ...structuredClone(args)));
    },
    send: (ch, ...args) => mainOn.get(ch)?.forEach((l) => l(event, ...structuredClone(args))),
    on: (ch, l) => add(rendererOn, ch, l)
  };
  return { ipcMain, ipcRenderer, listeners: (ch: string) => mainOn.get(ch)?.size ?? 0 };
}
