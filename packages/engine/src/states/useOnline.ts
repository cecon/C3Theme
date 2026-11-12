import { useSyncExternalStore } from 'react';

import { useEngine } from '../context';
import { browserConnectivity } from './connectivity';

/** Se o app está on-line, pela porta `connectivity` do <C3Shell> (padrão: o navegador). Muda sozinho. */
export function useOnline(): boolean {
  const port = useEngine().connectivity ?? browserConnectivity;
  return useSyncExternalStore(port.subscribe, port.online, () => true);
}
