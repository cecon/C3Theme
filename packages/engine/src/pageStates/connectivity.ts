import { useCallback, useSyncExternalStore } from 'react';
import type { ConnectivityPort } from './types';

const browser: ConnectivityPort = {
  getOnline: () => typeof navigator === 'undefined' || navigator.onLine !== false,
  subscribe(listener) {
    window.addEventListener('online', listener);
    window.addEventListener('offline', listener);
    return () => {
      window.removeEventListener('online', listener);
      window.removeEventListener('offline', listener);
    };
  }
};
export function usePageOnline(port: ConnectivityPort = browser) {
  const subscribe = useCallback((listener: () => void) => port.subscribe(listener), [port]);
  const snapshot = useCallback(() => port.getOnline(), [port]);
  return useSyncExternalStore(subscribe, snapshot, () => true);
}
