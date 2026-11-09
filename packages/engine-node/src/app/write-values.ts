// O que vai para o sistema gravar (escrita delegada e filhas): os campos graváveis, escondido ou vazio como `null`.
// Campo só de escrita (senha) vem só com valor novo; arquivo: o novo vem com `data`, `null` remove, sem a chave fica.

import type { Entity } from '../domain/entity';
import { isNewFile } from '../domain/file';
import type { Rec } from '../domain/types';
import { isEmpty } from '../domain/value';
import { writable } from './read';
import { isVisible } from './validation';

export function writeValues(entity: Entity, record: Rec): Rec {
  const out: Rec = {};
  for (const f of writable(entity)) {
    const v = record[f.name] ?? null;
    const keep = isVisible(entity, f, record) && !isEmpty(v);
    if (!keep && f.writeOnly) continue;
    if (keep && f.type === 'file' && !isNewFile(v)) continue;
    out[f.name] = keep ? v : null;
  }
  return out;
}
