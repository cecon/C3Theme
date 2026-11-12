// Rascunho do editor de fluxo (views.flow, #72): o grafo como o usuário mexe, o que está gravado e o PATCH do campo
// text com If-Match. Problema no fluxo barra a gravação: o sistema que roda o fluxo recebe sempre um grafo válido.
import { useState } from 'react';
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

/** O que está gravado no registro: o texto do grafo (para comparar com o rascunho) e a versão (para o If-Match). */
const savedOf = (record: WireRecord, field: string) => ({
  text: serializeFlow(parseFlow(record[field]) ?? EMPTY_FLOW),
  version: record._version as string | undefined
});

export function useFlowDraft(entity: string, id: string, field: string, record: WireRecord, kinds: FlowNodeKind[]) {
  const { client } = useEngine();
  const { mutate } = useSWRConfig();
  const [saved, setSaved] = useState(() => savedOf(record, field));
  const [draft, setDraft] = useState<FlowGraph>(() => JSON.parse(saved.text) as FlowGraph);
  const [error, setError] = useState<FlowSaveError>();
  const [busy, setBusy] = useState(false);
  const dirty = serializeFlow(draft) !== saved.text;
  const key = ['c3-record', entity, id];

  const change = (next: FlowGraph) => {
    setDraft(next);
    setError(undefined);
  };
  /** Passa a valer o registro lido agora: o gravado, a versão e o rascunho. */
  const reset = (row: WireRecord) => {
    const next = savedOf(row, field);
    setSaved(next);
    change(JSON.parse(next.text) as FlowGraph);
  };
  const discard = () => change(JSON.parse(saved.text) as FlowGraph);

  async function reload() {
    const row = await client.get(entity, id);
    await mutate(key, row, { revalidate: false });
    reset(row);
  }

  async function save() {
    const problems = validateFlow(draft, kinds).length;
    if (problems) {
      setError({ message: `Corrija ${problems === 1 ? 'o problema' : `os ${problems} problemas`} do fluxo antes de salvar.` });
      return;
    }
    setBusy(true);
    try {
      const text = serializeFlow(draft);
      const row = await client.update(entity, id, { [field]: text }, saved.version ? { ifMatch: saved.version } : undefined);
      setSaved({ text, version: row._version as string | undefined });
      setError(undefined);
      // o formulário do registro lê a mesma chave: volta para ele já com o grafo novo
      await mutate(key, row, { revalidate: false });
    } catch (e) {
      setError(
        isStale(e)
          ? {
              message: 'Outra pessoa alterou este registro depois que você abriu o fluxo. Recarregue para ver a versão atual.',
              stale: true
            }
          : { message: e instanceof Error ? e.message : 'Erro ao salvar o fluxo.' }
      );
    } finally {
      setBusy(false);
    }
  }

  return { draft, dirty, error, busy, change, discard, save, reload };
}
