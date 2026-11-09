import { useEffect, useRef, useState } from 'react';

import type { Message } from '../core/types';

/** O assistente ainda está trabalhando (pensando ou usando ferramentas): escrevendo, mas sem resposta ainda. */
export const isWorking = (m: Message) => !!m.streaming && !m.text;

/**
 * Quanto tempo o assistente trabalhou antes de começar a responder ("Pensou por 4 s"). Usa `reasoningMs` quando o
 * servidor manda; senão mede na tela, do momento em que viu o trabalho começar até a resposta aparecer. Resposta
 * que já chegou pronta (histórico) e sem `reasoningMs` fica sem tempo.
 */
export default function useWorkTime(m: Message): number | undefined {
  const working = isWorking(m);
  const started = useRef<number | null>(null);
  const [measured, setMeasured] = useState<number | undefined>(undefined);

  // outra resposta (gerar de novo, outra conversa): mede do zero
  useEffect(() => {
    started.current = null;
    setMeasured(undefined);
  }, [m.id]);

  useEffect(() => {
    if (working) {
      started.current ??= performance.now();
    } else if (started.current !== null) {
      setMeasured(performance.now() - started.current);
      started.current = null;
    }
  }, [working]);

  return m.reasoningMs ?? measured;
}
