// Regras do Desfazer sem React (spec/README.md, "Versão e Desfazer"): quando a tela oferece o botão e o que ela diz
// quando o servidor recusa. Quem garante é o backend (If-Match + C3-Undo); aqui só se evita oferecer o que ele recusa.

import type { ActionDef, Capabilities, EntityDef } from './types';

/** Quanto tempo o "Desfazer" fica na tela depois de gravar ou rodar a ação. É só da tela: a garantia é a versão. */
export const UNDO_MS = 30_000;

/** Num 412 do Desfazer: alguém gravou no meio, e o servidor não desfez para não apagar a alteração. */
export const STALE_UNDO = 'Alguém alterou este registro depois. Para não apagar essa alteração, nada foi desfeito.';

/** A entidade aceita Desfazer (`undoable` ausente vale true). */
export const undoable = (def: EntityDef) => def.undoable !== false;

/** A inversa de `action` que o usuário pode rodar agora, se a entidade aceita Desfazer. */
export function inverseOf(def: EntityDef, capabilities: Capabilities, action: ActionDef): ActionDef | undefined {
  if (!undoable(def) || !action.inverse || !capabilities.actions?.[action.inverse]) return undefined;
  return def.actions?.find((a) => a.name === action.inverse && a.target !== 'list' && !a.input);
}
