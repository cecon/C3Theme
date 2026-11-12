import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';

import { notify } from '@c3theme/ui';
import type { C3Client } from '../api';
import { loadEntities } from '../access';
import type { EngineState } from '../context';

/**
 * Lê o GET /_meta/app de novo e troca app, entidades e permissão das páginas sem remontar a shell: as páginas
 * abertas continuam (conversa com resposta chegando, formulário pela metade). Para menu que muda com os dados
 * (um item por agente contratado, #163). Roda quando `version` muda (não na primeira vez) e pela função devolvida,
 * que a shell põe em `useEngine().reloadApp`. Se falhar, a tela continua com o app de antes e avisa.
 */
export default function useAppReload(
  client: C3Client,
  setState: Dispatch<SetStateAction<EngineState | undefined>>,
  version: string | number | undefined
): () => Promise<void> {
  const reload = useCallback(async () => {
    try {
      const { app, pageAccess } = await client.meta();
      // O status público substitui as páginas; entidades podem estar indisponíveis durante a manutenção.
      const entities = app.status ? {} : await loadEntities(client, app.entities);
      setState((s) => s && { ...s, app, entities, pageAccess });
    } catch {
      notify('Não foi possível atualizar o menu.', 'error');
    }
  }, [client, setState]);

  const seen = useRef(version);
  useEffect(() => {
    if (seen.current === version) return;
    seen.current = version;
    void reload();
  }, [version, reload]);

  return reload;
}
