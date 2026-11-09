import useSWR from 'swr';

import { useEngine } from '../../context';
import type { AggregateParams } from '../../dashboard';

/**
 * GET /{entity}/_aggregate; `null` não chama (soma opcional do widget). A chave começa com 'c3-list': gravar um
 * registro ou rodar uma ação atualiza o painel.
 */
export function useAggregate(entity: string, params: AggregateParams | null) {
  const { client, org } = useEngine();
  return useSWR(params ? ['c3-list', entity, 'aggregate', JSON.stringify(params), org?.active] : null, () =>
    client.aggregate(entity, params!)
  );
}
