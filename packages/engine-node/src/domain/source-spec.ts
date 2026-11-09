// Consulta do sistema (`source: "system"`): a entidade não tem tabela; as linhas vêm de um SELECT que o sistema monta
// com os parâmetros pedidos antes. Os parâmetros são uma entidade sem tabela, como o input de ação; `default` pode
// ser data relativa (`{"$date": "today"}`), resolvida a cada pedido.

import { type Entity, fieldsOnly, resolveConditions } from './entity';
import { onlyForRecords, parseFields } from './field';
import { isRelative } from './relative-date';
import { type Rec, isObject } from './types';

export interface Source {
  /** Os parâmetros (`params.fields`); a consulta recebe todos, no formato trafegado. */
  params: Entity;
  /** `default` relativo de cada parâmetro (nome, valor cru), resolvido pelo relógio do sistema. */
  relativeDefaults: [string, Rec][];
}

export function parseSource(name: string, source: unknown, params: unknown, ident: (n: string) => boolean): Source | undefined {
  if (source === undefined || source === null) {
    if (params !== undefined && params !== null) throw new Error(`${name}: params só vale com source 'system'`);
    return undefined;
  }
  if (source !== 'system') throw new Error(`${name}: source '${String(source)}' desconhecido (só 'system')`);
  const label = `${name}.params`;
  const relativeDefaults: [string, Rec][] = [];
  const raw: unknown[] = [];
  const list = isObject(params) && Array.isArray(params.fields) ? params.fields : [];
  for (const f of list) {
    if (isObject(f) && isObject(f.default) && isRelative(f.default)) {
      const field = typeof f.name === 'string' ? f.name : '';
      if (f.type !== 'date' && f.type !== 'datetime') throw new Error(`${label}.${field}: default relativo só em date ou datetime`);
      relativeDefaults.push([field, f.default]);
      const { default: _rel, ...rest } = f;
      raw.push(rest);
    } else raw.push(f);
  }
  const [fields, conditions] = parseFields(label, raw, ident);
  const bad = fields.find(onlyForRecords);
  if (bad) throw new Error(`${label}: '${bad.name}' não pode ser readOnly, createOnly nem ter filter ou access`);
  const entity = fieldsOnly(label, fields);
  resolveConditions(entity, conditions);
  return { params: entity, relativeDefaults };
}
