import { useCallback, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';

import { useEngine } from '../context';
import type { ActionResult, WireRecord } from '../types';

/** Andamento da ação em etapas, para o diálogo da barra. */
export interface StepsState {
  action: string;
  /** Sem a primeira resposta, o total ainda não se sabe: barra indeterminada. */
  total?: number;
  done: number;
  message?: string | null;
  stopping: boolean;
  error?: string;
}

/** Como a rodada acabou: terminou (com a última resposta), parou pelo usuário ou falhou numa etapa. */
export type StepsOutcome =
  { kind: 'finished'; result: ActionResult } | { kind: 'stopped'; done: number; total: number } | { kind: 'failed'; error: string };

/**
 * Ação da lista `steps` (#53): chama `POST /{entity}/_actions/{action}` com o `cursor` da resposta anterior até
 * `done == total`. Parar só deixa de chamar depois da etapa em curso: o que já foi gravado fica. No fim, em
 * qualquer caso, as listas recarregam.
 */
export default function useStepsRun(entity: string) {
  const { client } = useEngine();
  const { mutate } = useSWRConfig();
  const [state, setState] = useState<StepsState | null>(null);
  const stop = useRef(false);

  const run = useCallback(
    async (action: string, input: WireRecord): Promise<StepsOutcome> => {
      stop.current = false;
      setState({ action, done: 0, stopping: false });
      let cursor: unknown;
      let outcome: StepsOutcome;
      try {
        for (;;) {
          const result = await client.listAction(entity, action, input, cursor);
          const p = result.progress;
          // sem progress, ou com tudo feito: a última etapa
          if (!p || p.done >= p.total || p.cursor === null || p.cursor === undefined) {
            outcome = { kind: 'finished', result };
            break;
          }
          setState((s) => s && { ...s, total: p.total, done: p.done, message: result.message });
          if (stop.current) {
            outcome = { kind: 'stopped', done: p.done, total: p.total };
            break;
          }
          cursor = p.cursor;
        }
      } catch (e) {
        outcome = { kind: 'failed', error: e instanceof Error ? e.message : 'Erro ao executar.' };
      }
      mutate((key) => Array.isArray(key) && (key[0] === 'c3-list' || key[0] === 'c3-record'));
      if (outcome.kind === 'failed') setState((s) => s && { ...s, stopping: false, error: outcome.error });
      else setState(null);
      return outcome;
    },
    [client, entity, mutate]
  );

  const requestStop = useCallback(() => {
    stop.current = true;
    setState((s) => s && { ...s, stopping: true });
  }, []);

  const close = useCallback(() => setState(null), []);

  return { state, run, requestStop, close };
}
