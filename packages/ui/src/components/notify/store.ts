import { useSyncExternalStore } from 'react';

import { dismiss, EMPTY, push, type NotifyAction, type NotifySeverity, type QueueState } from './queue';

let state: QueueState = EMPTY;
let seq = 0;
const listeners = new Set<() => void>();
const set = (next: QueueState) => {
  if (next === state) return;
  state = next;
  listeners.forEach((l) => l());
};

/**
 * Mostra um aviso curto no canto da tela. Funciona de qualquer lugar, inclusive fora de componentes. Até três ficam
 * na tela ao mesmo tempo; os demais esperam a vez. Devolve o id, para fechar antes da hora com `dismissNotice`.
 */
export function notify(message: string, severity: NotifySeverity = 'success', action?: NotifyAction): number {
  const id = ++seq;
  set(push(state, { id, message, severity, action }));
  return id;
}

/** Fecha um aviso (na tela ou ainda esperando). */
export function dismissNotice(id: number) {
  set(dismiss(state, id));
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useNotices = () =>
  useSyncExternalStore(
    subscribe,
    () => state.visible,
    () => EMPTY.visible
  );
