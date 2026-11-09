// O que a ação devolve: o aviso, o arquivo de uma ação `returns: "file"` e o registro que a shell abre depois (`open`).

import type { Action } from '../domain/action-spec';
import type { Entity } from '../domain/entity';
import { ApiError } from '../domain/errors';
import type { Rec } from '../domain/types';
import type { ActionOutcome, FileContent } from '../ports/hooks';

export type ActionReply = { kind: 'json'; body: Rec } | { kind: 'file'; file: FileContent; message?: string };

/** Confere o que o sistema devolveu contra a spec; `data` é o registro relido (ação de registro). */
export function buildReply(
  known: (entity: string) => boolean,
  entity: Entity,
  action: Action,
  outcome: ActionOutcome,
  data?: unknown
): ActionReply {
  const broken = (what: string) => {
    console.error(`c3-engine-node: ação ${entity.name}.${action.name} ${what}`);
    return ApiError.internal();
  };
  if (outcome.file) {
    if (!action.returnsFile) throw broken('devolveu arquivo sem returns: "file" na spec');
    return { kind: 'file', file: outcome.file, message: outcome.message };
  }
  const body: Rec = { message: outcome.message ?? null };
  if (data !== undefined) body.data = data;
  if (outcome.open) {
    const target = outcome.open.entity ?? entity.name;
    if (!known(target)) throw broken(`pediu para abrir '${target}', que não está no app`);
    body.open = { entity: target, id: outcome.open.id };
  }
  return { kind: 'json', body };
}

/** O JSON, para quem não aceita arquivo (lote). */
export function replyJson(r: ActionReply): Rec {
  if (r.kind === 'file') throw ApiError.internal();
  return r.body;
}
