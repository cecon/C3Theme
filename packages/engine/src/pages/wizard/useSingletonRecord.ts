// O registro único (`singleton`) da filial ativa, com a mesma chave da tela dele: gravar no assistente atualiza a
// guarda e a tela de configuração.
import useSWR from 'swr';

import { useEngine } from '../../context';

export function useSingletonRecord(entity: string | undefined) {
  const { client, org } = useEngine();
  const { data, error, mutate } = useSWR(entity ? ['c3-list', entity, 'singleton', org?.active] : null, () =>
    client.list(entity!, { page: 1, pageSize: 10 })
  );
  return { record: data?.data[0], loaded: data !== undefined || error !== undefined, error, reload: () => mutate() };
}
