// Versão do registro (controle otimista): `_version` em toda resposta com registro; `If-Match` em alterar, excluir e
// ação grava só se a versão ainda é a mesma (412 `stale`); o Desfazer (`C3-Undo: true`) exige a versão.

import { createHash } from 'node:crypto';

import type { Entity } from '../domain/entity';
import { ApiError } from '../domain/errors';
import { type Rec, isObject } from '../domain/types';
import type { EngineRequest } from '../ports/request';
import { strip } from './access';
import type { Ctx } from './ctx';

export const VERSION_KEY = '_version';

/** Hash dos campos visíveis do registro (reference pelo id), 12 bytes em hex. Filhas e títulos ficam fora. */
export function versionOfVisible(entity: Entity, record: Rec): string {
  const h = createHash('sha256');
  const feed = (name: string, v: unknown) => {
    h.update(name);
    h.update('\u0000');
    h.update(JSON.stringify(v ?? null));
    h.update('\u0000');
  };
  feed('id', record.id);
  for (const f of entity.fields) {
    if (!(f.name in record)) continue;
    const v = record[f.name];
    feed(f.name, f.type === 'reference' ? (isObject(v) ? (v.id ?? null) : null) : v);
  }
  return h.digest('hex').slice(0, 24);
}

/** Versão de um registro lido do banco (ainda com tudo), como este usuário a recebeu. */
export function versionOf(ctx: Ctx, entity: Entity, record: Rec): string {
  const seen = { ...record };
  strip(ctx, entity, seen);
  return versionOfVisible(entity, seen);
}

/** O que o pedido exige do registro: as versões do `If-Match` (vazio = qualquer uma) e se é um Desfazer. */
export class Expect {
  constructor(
    readonly versions: string[] = [],
    readonly undo = false
  ) {}

  /** Lê `If-Match` (`"v"`, `W/"v"`, lista separada por vírgula, `*` = qualquer) e `C3-Undo`. */
  static from(req: EngineRequest): Expect {
    const raw = req.headers['if-match'];
    const versions = (raw ?? '')
      .split(',')
      .map((t) =>
        t
          .trim()
          .replace(/^(W\/)+/, '')
          .replace(/^"+|"+$/g, '')
      )
      .filter((t) => t !== '' && t !== '*');
    const u = req.headers['c3-undo'];
    if (u !== undefined && u !== 'true') throw ApiError.badRequest("C3-Undo só aceita 'true'.");
    const undo = u === 'true';
    if (undo && versions.length === 0) throw ApiError.badRequest('Desfazer precisa do If-Match com a _version de depois da gravação.');
    return new Expect(versions, undo);
  }

  /** Desfazer só onde a entidade deixa (`undoable`) e, numa ação, só a inversa de outra (`inverse`). */
  allowUndo(entity: Entity, action?: string): void {
    if (!this.undo) return;
    if (!entity.undoable) throw ApiError.conflict('Este registro não tem Desfazer.');
    if (action !== undefined && !entity.actions.some((a) => a.inverse === action))
      throw ApiError.conflict('Esta ação não desfaz nenhuma outra.');
  }

  /** O registro ainda está na versão pedida? Senão 412 `stale`. */
  check(ctx: Ctx, entity: Entity, record: Rec): void {
    if (this.versions.length && !this.versions.includes(versionOf(ctx, entity, record))) throw ApiError.stale();
  }
}
