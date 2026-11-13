import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RAIL_PREFERENCES_PADRAO, readRailPreferences, writeRailPreferences, type RailPreferences } from './preferences';

const changed = 'c3-theme:rail-preferences-changed';
function storage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}
function read(key: string) {
  const target = storage();
  return target ? readRailPreferences(target, key) : RAIL_PREFERENCES_PADRAO;
}
/** Cada alteração relê a chave compartilhada; um rail nunca apaga a escolha recente do outro. */
export function useRailPreferences(key: string) {
  const initial = useMemo(() => read(key), [key]);
  const [state, setState] = useState({ key, value: initial });
  const pending = useRef<{ key: string; value: Partial<RailPreferences> }>({ key, value: {} });
  const value = state.key === key ? state.value : initial;
  useEffect(() => {
    setState({ key, value: read(key) });
    const receive = (event: Event) => {
      if (event instanceof StorageEvent) {
        if (event.key !== key && event.key !== null) return;
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
      const extra = pending.current.key === key ? pending.current.value : {};
      const next = { ...read(key), ...extra, ...change };
      const target = storage();
      const stored = target && writeRailPreferences(target, key, next);
      pending.current = { key, value: stored ? {} : { ...extra, ...change } };
      const detail = { key, value: next };
      setState(detail);
      window.dispatchEvent(new CustomEvent(changed, { detail }));
    },
    [key]
  );
  return [value, patch] as const;
}
