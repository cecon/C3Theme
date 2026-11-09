// Regras do tempo real na shell: o que reler, quando tocar o som e quanto esperar para reconectar. Sem React.

import type { EntityDef } from '../types';
import type { LiveChange } from './sse';

/**
 * Chaves do SWR que um aviso da entidade relê: lista, totais, quadro, calendário, relatório e checklist. O formulário
 * aberto (`c3-record`) e a configuração de registro único ficam: reler por cima do que o usuário digita perde o que
 * ele digitou, e a versão do registro (If-Match) já barra salvar por cima de quem mudou antes.
 */
export const liveKeyOf = (entity: string) => (key: unknown) =>
  Array.isArray(key) && (key[0] === 'c3-list' || key[0] === 'c3-checklist') && key[1] === entity && key[2] !== 'singleton';

/** Avisos que tocam o som (`live.sound.on`). */
export function soundOn(def: EntityDef): LiveChange[] {
  return typeof def.live === 'object' ? (def.live.sound?.on ?? []) : [];
}

/** Espera antes de reconectar: dobra a cada falha, de 1 s até 30 s. */
export const nextWait = (wait: number) => Math.min(wait * 2, 30_000);
