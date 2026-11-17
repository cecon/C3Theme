import { useEffect, useMemo, useState } from 'react';

import type { AssistantChat } from '@c3theme/chat';

import { hasAside, lanesApi, type WireLane } from '../agent/lanes';
import { ApiError } from '../apiError';
import { useEngine } from '../context';
import type { ChatDef } from './chatDef';

export type LaneRun = (work: () => Promise<{ lane?: WireLane; message?: string } | undefined>) => Promise<boolean>;

/**
 * Estado das conversas à parte de uma conversa (issue #10), o mesmo para o painel ao lado e para as abas (#134): a
 * lista de GET /_lanes (relida a cada resposta), quem está aberta, o erro e o `run` que serializa as aberturas.
 */
export default function useLanes(def: ChatDef, chat: AssistantChat) {
  const { client } = useEngine();
  const api = useMemo(() => lanesApi(client), [client]);
  const [lanes, setLanes] = useState<WireLane[]>([]);
  const [selected, setSelected] = useState<string>();
  const [available, setAvailable] = useState(true);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const declared = !!def.lanes || !!def.tabs;
  const enabled = !!api && available;

  useEffect(() => {
    if (!api || !declared) return;
    let live = true;
    void api.list(chat.conversationId).then(
      (items) => {
        if (!live) return;
        setLanes(items);
        setLoaded(true);
        setListError('');
      },
      (e: unknown) => {
        if (!live) return;
        setLoaded(true);
        if (e instanceof ApiError && e.status === 404) setAvailable(false);
        else setListError(e instanceof Error ? e.message : 'Não foi possível abrir as conversas.');
      }
    );
    return () => {
      live = false;
    };
  }, [api, declared, chat.conversationId, chat.messages.length, chat.generating, attempt]);

  const run: LaneRun = async (work) => {
    if (pending) return false;
    setPending(true);
    setError('');
    try {
      const result = await work();
      if (result?.lane) {
        const lane = result.lane;
        setLanes((items) => [...items.filter((l) => l.id !== lane.id), lane]);
        setSelected(lane.id);
      }
      if (result?.message) setError(result.message);
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setAvailable(false);
      setError(e instanceof Error ? e.message : 'Não foi possível abrir a conversa.');
      return false;
    } finally {
      setPending(false);
    }
  };

  const aside =
    enabled && hasAside(def) && !pending
      ? (value: string) => run(async () => ({ lane: await api!.open(chat.conversationId, { kind: 'aside', text: value || undefined }) }))
      : undefined;
  return {
    api,
    lanes,
    selected,
    setSelected,
    enabled,
    error: error || listError,
    actionError: error,
    clearError: () => {
      setError('');
      setListError('');
    },
    listError,
    loading: enabled && declared && !loaded,
    retryList: () => setAttempt((n) => n + 1),
    pending,
    run,
    aside
  };
}
