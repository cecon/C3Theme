import { useCallback, useEffect, useMemo, useState } from 'react';
import { RAIL_PREFERENCES_PADRAO, readRailPreferences, writeRailPreferences, type RailPreferences } from './preferences';

const changed = 'c3-theme:rail-preferences-changed';
const memory = new Map<string, RailPreferences>();
function storage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}
function read(key: string) {
  const temporary = memory.get(key);
  if (temporary) return temporary;
  const target = storage();
  return target ? readRailPreferences(target, key) : RAIL_PREFERENCES_PADRAO;
}
/** Cada alteração relê a chave compartilhada; um rail nunca apaga a escolha recente do outro. */
export function useRailPreferences(key: string) {
  const initial = useMemo(() => read(key), [key]);
  const [state, setState] = useState({ key, value: initial });
  const value = state.key === key ? state.value : initial;
  useEffect(() => {
    setState({ key, value: read(key) });
    const receive = (event: Event) => {
      if (event instanceof StorageEvent) {
        if (event.key !== key && event.key !== null) return;
        memory.delete(key);
        setState({ key, value: read(key) });
      } else {
        const detail = (event as CustomEvent<{ key: string; value: RailPreferences }>).detail;
        if (detail.key === key) setState(detail);
      }
    };
    window.addEventListener(changed, receive);
    window.addEventListener('storage', receive);
    return () => {
      window.removeEventListener(changed, receive);
      window.removeEventListener('storage', receive);
    };
  }, [key]);
  const patch = useCallback(
    (change: Partial<RailPreferences>) => {
      const next = { ...read(key), ...change };
      const target = storage();
      const stored = target && writeRailPreferences(target, key, next);
      if (stored) memory.delete(key);
      else memory.set(key, next);
      const detail = { key, value: next };
      setState(detail);
      window.dispatchEvent(new CustomEvent(changed, { detail }));
    },
    [key]
  );
  return [value, patch] as const;
}
