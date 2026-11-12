import { Component, Suspense, useCallback, useMemo, useState, type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { PanelSkeleton } from '@c3theme/ui';
import { ApiError } from '../apiError';
import { useEngine } from '../context';
import { PageStateContext } from './context';
import { usePageOnline } from './connectivity';
import { pageStateMiddleware } from './middleware';
import { pageDataState } from './state';
import { PageStateView } from './PageStateView';
import type { PageDataState, PageStates } from './types';

const swrConfig = { use: [pageStateMiddleware] };
/** Opt-in: o corpo permanece montado, inclusive quando uma faixa de conexão/erro usa o cache. */
export default function PageStatesFrame({ states, children }: { states: PageStates; children: ReactNode }) {
  const { connectivity } = useEngine();
  const online = usePageOnline(connectivity);
  const [resources, setResources] = useState<Record<string, PageDataState>>({});
  const [attempt, setAttempt] = useState(0);
  const report = useCallback((id: string, state?: PageDataState) => {
    setResources((old) => {
      if (!state && !(id in old)) return old;
      const next = { ...old };
      if (state) next[id] = state;
      else delete next[id];
      return next;
    });
  }, []);
  const context = useMemo(() => ({ report }), [report]);
  const data = pageDataState(Object.values(resources));
  const retry = () => {
    for (const resource of Object.values(resources)) void Promise.resolve(resource.retry?.()).catch(() => {});
    setAttempt((value) => value + 1);
  };
  const kind =
    data.error instanceof ApiError && data.error.status === 403
      ? 'forbidden'
      : data.error
        ? 'error'
        : data.loading
          ? 'loading'
          : data.empty
            ? 'empty'
            : undefined;
  const state = kind && states[kind];
  const replace = !!state && (!data.hasData || kind === 'forbidden');
  const fallback = states.loading ? <PageStateView kind="loading" state={states.loading} retry={retry} /> : <PanelSkeleton />;
  return (
    <PageStateContext.Provider value={context}>
      <SWRConfig value={swrConfig}>
        <Stack spacing={2}>
          {!online && states.offline && <PageStateView kind="offline" state={states.offline} retry={retry} />}
          {state && <PageStateView kind={kind!} state={state} retry={retry} />}
          <Box sx={replace ? { display: 'none' } : undefined}>
            <PageBoundary resetKey={attempt} fallback={states.error && <PageStateView kind="error" state={states.error} retry={retry} />}>
              <Suspense fallback={fallback}>{children}</Suspense>
            </PageBoundary>
          </Box>
        </Stack>
      </SWRConfig>
    </PageStateContext.Provider>
  );
}

class PageBoundary extends Component<{ children: ReactNode; fallback: ReactNode; resetKey: number }, { error?: unknown }> {
  state: { error?: unknown } = {};
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  componentDidUpdate(prev: { resetKey: number }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: undefined });
  }
  render() {
    if (this.state.error) {
      if (!this.props.fallback) throw this.state.error;
      return this.props.fallback;
    }
    return this.props.children;
  }
}
