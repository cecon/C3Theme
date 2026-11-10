// Consultar e preencher (`lookups` da entidade): a origem é um campo string; o sistema consulta a fonte externa e
// devolve só os campos de `fills`.

import { type Entity, fieldOf, readableField } from './entity';
import { isObject } from './types';

export interface LookupSpec {
  name: string;
  field: string;
  fills: string[];
  /** Outros campos do formulário que vão junto ao sistema (a média depende da conta, do centro e do ano). */
  with: string[];
}

export function declaredLookups(e: Entity): LookupSpec[] {
  const raw = e.raw.lookups;
  if (raw === undefined || raw === null) return [];
  const ok =
    Array.isArray(raw) &&
    raw.every(
      (l) =>
        isObject(l) &&
        typeof l.name === 'string' &&
        typeof l.field === 'string' &&
        Array.isArray(l.fills) &&
        l.fills.every((x) => typeof x === 'string') &&
        (l.with === undefined || (Array.isArray(l.with) && l.with.every((x) => typeof x === 'string')))
    );
  if (!ok) throw new Error(`${e.name}: lookups mal formado`);
  return (raw as LookupSpec[]).map((l) => ({ name: l.name, field: l.field, fills: l.fills, with: l.with ?? [] }));
}

/** Subida: origem é string ou reference legível; destinos existem, são graváveis, não são a origem; nomes sem repetir. */
export function checkLookups(entities: Map<string, Entity>): void {
  for (const e of entities.values()) {
    const lookups = declaredLookups(e);
    lookups.forEach((l, i) => {
      const at = `${e.name}.lookups.${l.name}`;
      if (lookups.slice(0, i).some((x) => x.name === l.name)) throw new Error(`${at}: nome repetido`);
      const type = readableField(e, l.field)?.type;
      if (type !== 'string' && type !== 'reference')
        throw new Error(`${at}: field '${l.field}' precisa ser campo string ou reference que não seja writeOnly`);
      l.with.forEach((name, k) => {
        const f = readableField(e, name);
        if (!f || f.type === 'file' || name === l.field || l.with.slice(0, k).includes(name))
          throw new Error(`${at}.with: '${name}' precisa ser campo legível, não file, sem repetir e diferente da origem`);
      });
      for (const name of l.fills) {
        const f = fieldOf(e, name);
        if (!f || f.readOnly || f.writeOnly || f.type === 'file' || name === l.field)
          throw new Error(`${at}: '${name}' não pode ser preenchido (inexistente, origem, readOnly, writeOnly ou file)`);
      }
    });
  }
}
