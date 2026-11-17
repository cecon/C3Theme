// Abas abertas e nomes dados pela pessoa (#134), por servidor e por agente (a chave leva o app e a conversa). Ficam
// no localStorage e as outras janelas do mesmo app acompanham pelo evento `storage`. Sem armazenamento (modo
// privado, cota), valem só na sessão.

import { useCallback, useSyncExternalStore } from 'react';

export interface TabPrefs {
  /** Threads laterais abertas como aba, na ordem da faixa. */
  open: string[];
  names: Record<string, string>;
}

const EMPTY: TabPrefs = { open: [], names: {} };
const memory = new Map<string, TabPrefs>();
const cache = new Map<string, { raw: string | null; value: TabPrefs }>();
const listeners = new Set<() => void>();

export const tabPrefsKey = (app: string, conversation: string) =>
  `c3.chat.tabs/${encodeURIComponent(app)}/${encodeURIComponent(conversation)}`;

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function parse(raw: string | null): TabPrefs {
  try {
    const v = raw ? (JSON.parse(raw) as Partial<TabPrefs>) : {};
    const open = Array.isArray(v.open) ? v.open.filter((x): x is string => typeof x === 'string') : [];
    const names = v.names && typeof v.names === 'object' ? (v.names as Record<string, string>) : {};
    return { open, names };
  } catch {
    return EMPTY;
  }
}

/** A mesma referência enquanto o valor guardado não muda (exigência do useSyncExternalStore). */
export function readTabPrefs(key: string): TabPrefs {
  let raw: string | null;
  try {
    const store = storage();
    if (!store) return memory.get(key) ?? EMPTY;
    raw = store.getItem(key);
  } catch {
    return memory.get(key) ?? EMPTY;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value;
  const value = parse(raw);
  cache.set(key, { raw, value });
  return value;
}

export function writeTabPrefs(key: string, value: TabPrefs) {
  memory.set(key, value);
  try {
    storage()?.setItem(key, JSON.stringify(value));
  } catch {
    // sem armazenamento: fica na memória da sessão
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key?.startsWith('c3.chat.tabs/') && listener();
  globalThis.addEventListener?.('storage', onStorage);
  return () => {
    listeners.delete(listener);
    globalThis.removeEventListener?.('storage', onStorage);
  };
}

/** Preferências das abas desta conversa e como mudar (a mudança vale para as outras janelas também). */
export function useTabPrefs(key: string): [TabPrefs, (update: (p: TabPrefs) => TabPrefs) => void] {
  const prefs = useSyncExternalStore(
    subscribe,
    () => readTabPrefs(key),
    () => EMPTY
  );
  const change = useCallback((update: (p: TabPrefs) => TabPrefs) => writeTabPrefs(key, update(readTabPrefs(key))), [key]);
  return [prefs, change];
}
