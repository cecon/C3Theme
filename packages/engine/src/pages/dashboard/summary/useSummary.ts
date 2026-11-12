import useSWR from 'swr';

import { ApiError } from '../../../api';
import { useEngine } from '../../../context';
import type { SummarySource } from '../../../summary';

/**
 * GET do resumo do painel (#108). Os widgets do mesmo `source` dividem uma chamada só (mesma chave do SWR), e
 * `refresh` relê no intervalo (o progresso do "baixando").
 */
export function useSummary(source: SummarySource | undefined) {
  const { client, org } = useEngine();
  return useSWR(
    source ? ['c3-summary', source.path, org?.active] : null,
    () => {
      if (!client.summary) throw new ApiError(501, 'not_implemented', 'Este cliente do motor não lê resumo.');
      return client.summary(source!.path);
    },
    { refreshInterval: source?.refresh ? source.refresh * 1000 : 0 }
  );
}
