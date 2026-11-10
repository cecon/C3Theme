import { useCallback, useEffect, useRef, useState } from 'react';

import { useEngine } from '../context';
import type { SourceParams } from '../api';
import type { ActionDef, ActionPreview } from '../actionTypes';
import type useActionInput from './useActionInput';

export interface PreviewState {
  loading: boolean;
  data?: ActionPreview;
  error?: string;
}

/**
 * Prévia de uma ação `preview: true` (spec/README.md, "Prévia da ação"): pede ao abrir e a cada `refresh` (a shell
 * chama ao sair de um campo), nunca a cada tecla. Só pergunta de novo se o input mudou; resposta atrasada de um
 * pedido velho é descartada. As sugestões (`fill`) entram nos campos vazios.
 * `action` nulo desliga (ação sem prévia, ou em lote um por um). Em conjunto, `ids` leva a seleção.
 */
export default function useActionPreview(
  entity: string,
  action: ActionDef | null,
  id: string | undefined,
  form: ReturnType<typeof useActionInput>,
  /** Ação em conjunto: as linhas marcadas (a prévia é sobre todas). */
  ids?: string[],
  /** Consulta do sistema: os parâmetros da lista, com que as linhas marcadas foram lidas. */
  params?: SourceParams
) {
  const { client } = useEngine();
  const [state, setState] = useState<PreviewState>({ loading: false });
  const last = useRef<string | undefined>(undefined);
  const seq = useRef(0);
  const name = action?.preview ? action.name : undefined;
  const idsKey = ids?.join(',');
  const paramsKey = params ? JSON.stringify(params) : undefined;

  const refresh = useCallback(() => {
    if (!name) return;
    const input = form.snapshot();
    const key = JSON.stringify(input);
    if (key === last.current) return;
    last.current = key;
    const mine = ++seq.current;
    setState((s) => ({ ...s, loading: true }));
    client.preview(entity, name, id, input, idsKey?.split(','), paramsKey ? (JSON.parse(paramsKey) as SourceParams) : undefined).then(
      (data) => {
        if (mine !== seq.current) return;
        setState({ loading: false, data });
        if (data.fill) {
          form.fill(data.fill);
          // o campo que recebeu a sugestão não pede outra prévia ao perder o foco
          last.current = JSON.stringify({ ...input, ...data.fill });
        }
      },
      (e: Error) => mine === seq.current && setState({ loading: false, error: e.message })
    );
    // form muda a cada render; o que importa é o input, lido na hora do pedido
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, entity, id, idsKey, paramsKey, name, form.snapshot]);

  // ao abrir (ou trocar de ação): começa do zero e pede a primeira prévia
  useEffect(() => {
    last.current = undefined;
    setState({ loading: false });
    if (name) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, id, idsKey]);

  return { ...state, enabled: Boolean(name), refresh };
}
