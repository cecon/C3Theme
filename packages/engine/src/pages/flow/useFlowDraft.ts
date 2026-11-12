// Rascunho do editor de fluxo (views.flow, #72): o grafo como o usuário mexe, o que está gravado e o PATCH do campo
// text com If-Match. Problema no fluxo barra a gravação: o sistema que roda o fluxo recebe sempre um grafo válido.
import { useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';

import type { FlowGraph, FlowNodeKind } from '@c3theme/flow';
import { validateFlow } from '@c3theme/flow/core';

import { isStale } from '../../api';
import { useEngine } from '../../context';
import { EMPTY_FLOW, parseFlow, serializeFlow } from '../../flow';
import type { WireRecord } from '../../types';

export interface FlowSaveError {
  message: string;
  /** O registro mudou em outra sessão: só recarregando dá para gravar. */
  stale?: boolean;
}

export function useFlowDraft(entity: string, id: string, field: string, record: WireRecord, kinds: FlowNodeKind[]) {
  const { client } = useEngine();
  const { mutate } = useSWRConfig();
  const [saved, setSaved] = useState(() => serializeFlow(parseFlow(record[field]) ?? EMPTY_FLOW));
  const [version, setVersion] = useState(record._version as string | undefined);
  const [draft, setDraft] = useState<FlowGraph>(() => JSON.parse(saved) as FlowGraph);
  const [error, setError] = useState<FlowSaveError>();
  const [busy, setBusy] = useState(false);
  const dirty = useMemo(() => serializeFlow(draft) !== saved, [draft, saved]);

  const change = (next: FlowGraph) => {
    setDraft(next);
    setError(undefined);
  };
  const discard = () => change(JSON.parse(saved) as FlowGraph);

  async function save(): Promise<boolean> {
    const problems = validateFlow(draft, kinds).length;
    if (problems) {
      setError({ message: `Corrija ${problems === 1 ? 'o problema' : `os ${problems} problemas`} do fluxo antes de salvar.` });
      return false;
    }
    setBusy(true);
    try {
      const text = serializeFlow(draft);
      const row = await client.update(entity, id, { [field]: text }, version ? { ifMatch: version } : undefined);
      setSaved(text);
      setVersion(row._version as string | undefined);
      setError(undefined);
      await mutate(['c3-record', entity, id], row, { revalidate: false });
      return true;
    } catch (e) {
      setError(
        isStale(e)
          ? {
              message: 'Outra pessoa alterou este registro depois que você abriu o fluxo. Recarregue para ver a versão atual.',
              stale: true
            }
          : { message: e instanceof Error ? e.message : 'Erro ao salvar o fluxo.' }
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { draft, dirty, error, busy, change, discard, save };
}
