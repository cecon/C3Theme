// Regras do tempo real na shell: o que reler, quando tocar o som e quanto esperar para reconectar. Sem React.

import type { EntityDef } from '../types';
import type { LiveChange } from './sse';

/** Registros abertos em leitura, por entidade: o aviso relê esses também (#8). */
const watched = new Map<string, Map<string, number>>();

/** Marca o registro como aberto em leitura; devolve o que desmarca. Duas telas no mesmo registro contam duas vezes. */
export function watchRecord(entity: string, id: string): () => void {
  const ids = watched.get(entity) ?? new Map<string, number>();
  watched.set(entity, ids);
  ids.set(id, (ids.get(id) ?? 0) + 1);
  return () => {
    const n = (ids.get(id) ?? 1) - 1;
    if (n > 0) ids.set(id, n);
    else ids.delete(id);
  };
}

/**
 * Chaves do SWR que um aviso da entidade relê: lista, totais, quadro, calendário, relatório e checklist, e o registro
 * aberto em leitura (`watchRecord`) quando o aviso é dele ou não diz qual (`changed`). Formulário em edição e
 * configuração de registro único ficam: reler por cima do que o usuário digita perde o que ele digitou, e a versão do
 * registro (If-Match) já barra salvar por cima de quem mudou antes.
 */
export const liveKeyOf =
  (entity: string, id: string | null = null) =>
  (key: unknown) => {
    if (!Array.isArray(key) || key[1] !== entity) return false;
    if (key[0] === 'c3-record') return (id === null || key[2] === id) && Boolean(watched.get(entity)?.has(key[2] as string));
    return (key[0] === 'c3-list' || key[0] === 'c3-checklist') && key[2] !== 'singleton';
  };

/** Avisos que tocam o som (`live.sound.on`). */
export function soundOn(def: EntityDef): LiveChange[] {
  return typeof def.live === 'object' ? (def.live.sound?.on ?? []) : [];
}

/** Espera antes de reconectar: dobra a cada falha, de 1 s até 30 s. */
export const nextWait = (wait: number) => Math.min(wait * 2, 30_000);
