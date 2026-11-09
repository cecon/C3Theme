import useSWR from 'swr';

// material-ui
import Chip from '@mui/material/Chip';

import { useEngine } from '../context';

/**
 * Quantos registros a lista do item de menu tem (com o preset, na filial ativa): o tamanho da fila.
 * A chave começa com 'c3-list', então gravar ou rodar uma ação atualiza o número.
 */
export default function MenuCount({ entity, preset }: { entity: string; preset?: string }) {
  const { client, entities, org } = useEngine();
  const where = entities[entity]?.def.views?.list?.presets?.find((p) => p.id === preset)?.where;
  const { data } = useSWR(['c3-list', entity, 'count', preset, org?.active], () => client.list(entity, { pageSize: 10, where }), {
    refreshInterval: 60_000
  });
  if (!data || data.meta.total === 0) return null;
  return (
    <Chip size="small" color="primary" label={data.meta.total > 99 ? '99+' : data.meta.total} sx={{ ml: 1, height: 20, fontWeight: 600 }} />
  );
}
