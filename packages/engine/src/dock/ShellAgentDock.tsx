import { ReactNode, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router';
import { AgentDock, AgentDockFrame } from '@c3theme/ui';
import { useEngine, useText } from '../context';
import { usePageOnline } from '../pageStates/connectivity';
import type { AgentDockDef, AgentDockPort, AgentDockSnapshot } from './types';

const missing: AgentDockSnapshot = { items: [], error: true };
const noPort: AgentDockPort = { getSnapshot: () => missing, subscribe: () => () => {}, retry: () => {} };
export function ShellDockFrame({ children }: { children: ReactNode }) {
  const { app } = useEngine();
  const def = app.layout.agentDock;
  if (!def) return children;
  return (
    <AgentDockFrame position={def.position} size={def.size} dock={<ShellAgentDock def={def} />}>
      {children}
    </AgentDockFrame>
  );
}

export default function ShellAgentDock({ def }: { def: AgentDockDef }) {
  const { agentDocks, connectivity } = useEngine();
  const port = agentDocks && Object.hasOwn(agentDocks, def.source) ? (agentDocks[def.source] ?? noPort) : noPort;
  const text = useText();
  const navigate = useNavigate();
  const subscribe = useCallback((listener: () => void) => port.subscribe(listener), [port]);
  const read = useCallback(() => port.getSnapshot(), [port]);
  const snapshot = useSyncExternalStore(subscribe, read, read);
  const online = usePageOnline(connectivity);
  const offline = !online || snapshot.offline;
  const last = useRef<{ port: AgentDockPort; items: AgentDockSnapshot['items'] }>({ port, items: [] });
  useEffect(() => {
    if (!offline && !snapshot.error && !snapshot.loading) last.current = { port, items: snapshot.items };
  }, [port, snapshot, offline]);
  const items = offline && !snapshot.items.length && last.current.port === port ? last.current.items : snapshot.items;
  const [retryFailed, setRetryFailed] = useState<AgentDockSnapshot>();
  const empty = def.states?.empty;
  const retry = async () => {
    setRetryFailed(undefined);
    try {
      await port.retry();
    } catch {
      setRetryFailed(snapshot);
    }
  };
  return (
    <AgentDock
      label={text(def.label)}
      position={def.position}
      items={items}
      loading={snapshot.loading && !offline}
      error={!offline && (snapshot.error || retryFailed === snapshot)}
      offline={offline}
      messages={{
        loading: text(def.states?.loading, 'Carregando agentes…'),
        empty: text(empty?.message, 'Nenhum agente ativo.'),
        error: text(def.states?.error, 'Não foi possível carregar os agentes.'),
        offline: text(def.states?.offline, 'Sem conexão · último estado conhecido'),
        retry: text(def.states?.retry, 'Tentar de novo')
      }}
      emptyAction={empty?.action && <Button onClick={() => navigate(empty.action!.path)}>{text(empty.action.label)}</Button>}
      onRetry={port === noPort ? undefined : retry}
      onSelect={(id) => {
        const item = items.find((agent) => agent.id === id);
        if (item) navigate(item.path);
      }}
    />
  );
}
