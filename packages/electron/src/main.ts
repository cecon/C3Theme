// Entrada do processo main: liga o IPC (`serveC3`) e escolhe para onde vão os pedidos (`forwardTo`), com um
// backend local opcional (`startSidecar`).

export { fromPage, serveC3 } from './serve';
export type { C3Caller, C3Handler, IpcEventLike, IpcMainLike, ServeOptions } from './serve';
export { forwardTo, resolveInside } from './forward';
export type { ForwardOptions } from './forward';
export { freePort, startSidecar } from './sidecar';
export type { Sidecar, SidecarOptions } from './sidecar';
export type { WireRequest } from './wire';
