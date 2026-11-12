import { useContext, useEffect, useId } from 'react';
import type { Middleware } from 'swr';
import { PageStateContext } from './context';
import { emptyData } from './state';

/** Escopo local: conserva o cache/provedor SWR e observa apenas recursos de dados do motor. */
export const pageStateMiddleware: Middleware = (useNext) => (key, fetcher, config) => {
  const result = useNext(key, fetcher, config);
  const context = useContext(PageStateContext);
  const id = useId();
  const tracked = Array.isArray(key) && ['c3-list', 'c3-record'].includes(String(key[0]));
  const { data, error, isLoading, mutate } = result;
  const empty = Array.isArray(key) && key[0] === 'c3-record' ? data === null : emptyData(data);
  const hasData = data !== undefined && !empty;
  useEffect(() => {
    if (!tracked) return;
    context?.report(id, { loading: isLoading, empty: data !== undefined && empty, error, hasData, retry: () => mutate() });
    return () => context?.report(id);
  }, [context, id, tracked, data, error, isLoading, empty, hasData, mutate]);
  // Os widgets antigos mostram erro antes do cache. Com estados da página, o banner assume o erro e o dado fica.
  return context && tracked && hasData && error ? { ...result, error: undefined } : result;
};
