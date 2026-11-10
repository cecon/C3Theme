import { useEffect } from 'react';

import type { EntityDef } from '../types';
import { watchRecord } from './liveKeys';
import { useLive } from './useLive';

/**
 * Registro aberto de entidade `live` (#8): em leitura, o aviso de mudança relê o registro (campos, ações com
 * `visibleWhen`). Editando, não relê, para não perder o que o usuário digitou. `own` assina o canal aqui (página do
 * registro); dentro de lista, quadro ou calendário, a assinatura da tela de fora já serve.
 */
export function useLiveRecord(def: EntityDef, id: string | undefined, reading: boolean, own: boolean) {
  const watch = Boolean(def.live && !def.singleton && id && reading);
  useEffect(() => (watch ? watchRecord(def.name, id!) : undefined), [watch, def.name, id]);
  useLive(def, own && Boolean(id));
}
