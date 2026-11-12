import { useCallback, useState } from 'react';
import { useSWRConfig } from 'swr';

import { ApiError, type RefusedRecord, type SourceParams, type WriteOptions } from '../api';
import { useEngine } from '../context';
import type { ActionResult, BulkResult, FieldErrors, WireRecord } from '../types';

export interface ActionState {
  running: boolean;
  /** Erro geral da última tentativa (rede, permissão, conflito, regra de negócio sem campo). */
  error?: string;
  /** Erros por campo do input, como o backend mandou. */
  fieldErrors: FieldErrors;
}

/** Ação em conjunto: rodou (com a resposta), ou não rodou; `refused` lista os registros barrados, quando foi isso. */
export type TogetherOutcome = { ok: true; result: ActionResult } | { ok: false; refused?: RefusedRecord[] };

/**
 * Roda ações de uma entidade pelo contrato, para telas do motor e telas custom.
 * Depois de rodar, atualiza o registro e todas as listas em cache: uma ação costuma mexer em outras entidades
 * (cancelar a venda estorna títulos e estoque).
 * `run` devolve o resultado ou `undefined` quando falhou (o erro fica em `error`/`fieldErrors`).
 */
export default function useAction(entity: string) {
  const { client } = useEngine();
  const { mutate } = useSWRConfig();
  const [state, setState] = useState<ActionState>({ running: false, fieldErrors: {} });

  const run = useCallback(
    async (id: string, action: string, input?: WireRecord, opts?: WriteOptions): Promise<ActionResult | undefined> => {
      setState({ running: true, fieldErrors: {} });
      try {
        const result = await (opts ? client.action(entity, id, action, input, opts) : client.action(entity, id, action, input));
        // sem `data` (veio arquivo) ou null (a ação apagou): relê
        mutate(['c3-record', entity, id], result.data ?? undefined, { revalidate: result.data == null });
        mutate((key) => Array.isArray(key) && key[0] === 'c3-list');
        setState({ running: false, fieldErrors: {} });
        return result;
      } catch (e) {
        const fieldErrors = e instanceof ApiError && e.fields ? e.fields : {};
        // 409: o registro mudou e a ação deixou de valer; relê para o botão sumir
        if (e instanceof ApiError && e.status === 409) mutate(['c3-record', entity, id]);
        setState({ running: false, fieldErrors, error: e instanceof Error ? e.message : 'Erro ao executar.' });
        return undefined;
      }
    },
    [client, entity, mutate]
  );

  /**
   * Em lote: devolve o resultado de cada id, ou `undefined` quando o pedido inteiro foi recusado
   * (input inválido, sem permissão); aí o erro fica em `error`/`fieldErrors`, como em `run`.
   */
  const runBulk = useCallback(
    async (ids: string[], action: string, input?: WireRecord): Promise<BulkResult | undefined> => {
      setState({ running: true, fieldErrors: {} });
      try {
        const result = await client.bulkAction(entity, action, ids, input);
        for (const r of result.results) if (r.ok) mutate(['c3-record', entity, r.id], r.data ?? undefined, { revalidate: r.data === null });
        mutate((key) => Array.isArray(key) && key[0] === 'c3-list');
        setState({ running: false, fieldErrors: {} });
        return result;
      } catch (e) {
        const fieldErrors = e instanceof ApiError && e.fields ? e.fields : {};
        setState({ running: false, fieldErrors, error: e instanceof Error ? e.message : 'Erro ao executar.' });
        return undefined;
      }
    },
    [client, entity, mutate]
  );

  /**
   * Em conjunto (`bulk: 'together'`): uma execução sobre todos, tudo ou nada. Recusa por registro volta em
   * `refused` (e não em `error`: a tela mostra quem foi barrado); outro erro fica em `error`/`fieldErrors`.
   */
  const runTogether = useCallback(
    async (ids: string[], action: string, input?: WireRecord, params?: SourceParams): Promise<TogetherOutcome> => {
      setState({ running: true, fieldErrors: {} });
      try {
        const result = await client.togetherAction(entity, action, ids, input, params);
        for (const id of ids) mutate(['c3-record', entity, id]);
        mutate((key) => Array.isArray(key) && key[0] === 'c3-list');
        setState({ running: false, fieldErrors: {} });
        return { ok: true, result };
      } catch (e) {
        if (e instanceof ApiError && e.records?.length) {
          setState({ running: false, fieldErrors: {} });
          return { ok: false, refused: e.records };
        }
        const fieldErrors = e instanceof ApiError && e.fields ? e.fields : {};
        setState({ running: false, fieldErrors, error: e instanceof Error ? e.message : 'Erro ao executar.' });
        return { ok: false };
      }
    },
    [client, entity, mutate]
  );

  /** Ação da lista, sem registro: devolve a mensagem do sistema (e o arquivo ou o `open`), ou `undefined` quando falhou. */
  const runList = useCallback(
    async (action: string, input?: WireRecord): Promise<ActionResult | undefined> => {
      setState({ running: true, fieldErrors: {} });
      try {
        const result = await client.listAction(entity, action, input);
        mutate((key) => Array.isArray(key) && (key[0] === 'c3-list' || key[0] === 'c3-record'));
        setState({ running: false, fieldErrors: {} });
        return result;
      } catch (e) {
        const fieldErrors = e instanceof ApiError && e.fields ? e.fields : {};
        setState({ running: false, fieldErrors, error: e instanceof Error ? e.message : 'Erro ao executar.' });
        return undefined;
      }
    },
    [client, entity, mutate]
  );

  const reset = useCallback(() => setState({ running: false, fieldErrors: {} }), []);

  return { ...state, run, runBulk, runTogether, runList, reset };
}
