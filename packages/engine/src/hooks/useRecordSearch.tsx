import { useMemo } from 'react';

import type { RecordSearch } from '@c3theme/ui';
import { iconByName, useEngine } from '../context';

const LIMIT = 20;

/**
 * Busca de registros do Ctrl K (`layout.header.search: { records: true }`): liga a paleta ao GET /_search do backend e
 * troca o nome do ícone pelo componente do catálogo. Sem o `records` (ou sem `client.search`), undefined: só telas.
 */
export default function useRecordSearch(): RecordSearch | undefined {
  const { app, client, icons } = useEngine();
  const search = app.layout.header?.search;
  const on = typeof search === 'object' && search.records === true && Boolean(client.search);
  return useMemo(() => {
    if (!on) return undefined;
    return async (q, signal) => {
      const hits = await client.search!(q, LIMIT, signal);
      return hits.map((h) => {
        const Icon = iconByName(h.icon ?? undefined, icons);
        return { group: h.group, title: h.title, snippet: h.snippet, path: h.path, at: h.at, icon: Icon ? <Icon size={18} /> : undefined };
      });
    };
  }, [on, client, icons]);
}
