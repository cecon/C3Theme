import { createContext, useCallback, useContext, useEffect, useId, useRef } from 'react';
import type { PageDataState } from './types';

export interface PageStateContextValue {
  report(id: string, state?: PageDataState): void;
}
export const PageStateContext = createContext<PageStateContextValue | undefined>(undefined);
/** Página registrada declara o resultado da própria carga; o motor não interpreta sua árvore React. */
export function usePageState(state: PageDataState) {
  const context = useContext(PageStateContext);
  const id = useId();
  const snapshot = useRef(state);
  snapshot.current = state;
  const retryRef = useRef(state.retry);
  retryRef.current = state.retry;
  const retry = useCallback(() => retryRef.current?.(), []);
  const errorKey = state.error instanceof Error ? state.error.message : state.error;
  useEffect(() => {
    context?.report(id, { ...snapshot.current, retry });
    return () => context?.report(id);
  }, [context, id, state.loading, state.empty, errorKey, state.hasData, retry]);
}
