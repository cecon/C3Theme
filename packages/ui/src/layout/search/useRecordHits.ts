import { useEffect, useState } from 'react';

import type { RecordSearch, SearchHit } from './types';

const MIN = 2;
const WAIT = 200;

/**
 * Achados do backend para o texto: a partir de 2 caracteres, depois de 200 ms parado; texto novo cancela o pedido
 * anterior. Erro (404, rede) vira lista vazia, sem aviso: a paleta segue com as telas.
 */
export default function useRecordHits(search: RecordSearch | undefined, query: string) {
  const q = query.trim();
  const [state, setState] = useState<{ q: string; hits: SearchHit[] }>({ q: '', hits: [] });
  const active = Boolean(search) && q.length >= MIN;

  useEffect(() => {
    if (!search || q.length < MIN) return;
    const ctl = new AbortController();
    const timer = setTimeout(() => {
      search(q, ctl.signal).then(
        (hits) => !ctl.signal.aborted && setState({ q, hits }),
        () => !ctl.signal.aborted && setState({ q, hits: [] })
      );
    }, WAIT);
    return () => {
      clearTimeout(timer);
      ctl.abort();
    };
  }, [search, q]);

  return {
    // enquanto o pedido novo não volta, os achados do texto anterior ficam (sem piscar)
    hits: active ? state.hits : [],
    loading: active && state.q !== q
  };
}
