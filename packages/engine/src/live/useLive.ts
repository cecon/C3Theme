import { useEffect } from 'react';
import { useSWRConfig } from 'swr';

import { ApiError } from '../api';
import { useEngine } from '../context';
import type { EntityDef } from '../types';
import { beep } from './beep';
import { liveKeyOf, nextWait, soundOn } from './liveKeys';

/** Avisos que chegam juntos (ação em lote, carga do sistema) viram uma releitura só. */
const DEBOUNCE_MS = 300;

/**
 * Tempo real da entidade (`live`): enquanto a tela está aberta, assina GET /{entity}/_events e relê lista, totais,
 * quadro ou calendário a cada aviso; toca o som de `live.sound.on`. Caiu a conexão: reconecta (1 s, dobrando até
 * 30 s) e relê ao voltar, porque pode ter perdido avisos. 401, 403 e 404 param de tentar. Trocar de filial reassina.
 * `enabled` falso não assina (o formulário dentro de uma lista usa a assinatura dela).
 */
export function useLive(def: EntityDef, enabled = true) {
  const { client, org } = useEngine();
  const { mutate } = useSWRConfig();
  const live = enabled && def.live && !def.singleton ? JSON.stringify(def.live) : '';
  const entity = def.name;
  const sound = soundOn(def).join(',');

  useEffect(() => {
    if (!live || !client.events) return;
    const ctrl = new AbortController();
    const on = sound.split(',');
    let timer: ReturnType<typeof setTimeout> | undefined;
    // avisos juntos de registros diferentes viram "relê todos os abertos"
    let pending: string | null | undefined;
    const refresh = (id: string | null = null) => {
      clearTimeout(timer);
      pending = pending === undefined || pending === id ? id : null;
      timer = setTimeout(() => {
        const only = pending ?? null;
        pending = undefined;
        mutate(liveKeyOf(entity, only));
      }, DEBOUNCE_MS);
    };
    (async () => {
      let wait = 1000;
      let connected = false;
      while (!ctrl.signal.aborted) {
        try {
          await client.events!(
            entity,
            (m) => {
              if (m.type === 'ready') {
                if (connected) refresh();
                connected = true;
                wait = 1000;
                return;
              }
              if (m.type !== 'change') return;
              if (on.includes(m.change)) beep();
              refresh(m.id);
            },
            ctrl.signal
          );
        } catch (e) {
          if (e instanceof ApiError && [401, 403, 404].includes(e.status)) return;
        }
        await new Promise((r) => setTimeout(r, wait));
        wait = nextWait(wait);
      }
    })();
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [client, entity, live, sound, org?.active, mutate]);
}
