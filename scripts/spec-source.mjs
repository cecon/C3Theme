// Consulta do sistema (`source: system`): regras que o JSON Schema não expressa. Mesmas do boot do c3-engine.

import { isRelative, relativeError } from './spec-dates.mjs';

/** Parâmetros com nomes únicos e default no formato (ou data relativa); ninguém aponta para a consulta. */
export function checkSource(entity, entities, file, errors, wire) {
  for (const f of entity.fields)
    if (f.type === 'reference' && entities.get(f.entity)?.entity.source)
      errors.push(`${file}: '${f.name}' aponta para '${f.entity}', que é consulta do sistema`);
  for (const s of entity.views?.form?.sections ?? [])
    if (s.related && entities.get(s.related.entity)?.entity.source)
      errors.push(`${file}: '${s.related.entity}' é consulta do sistema e não pode ser filha (related)`);
  if (entity.params && !entity.source) errors.push(`${file}: params só vale com source 'system'`);
  if (!entity.source) return;
  const params = entity.params?.fields ?? [];
  if (new Set(params.map((f) => f.name)).size !== params.length) errors.push(`${file}: parâmetros repetidos`);
  for (const f of params) {
    const where = `${file} params.${f.name}`;
    if (f.default === undefined) continue;
    if (isRelative(f.default)) {
      const e = relativeError(f.default, f.type, 'eq');
      if (e) errors.push(`${where}: ${e}`);
    } else if (!wire[f.type]?.(f.default)) errors.push(`${where}: default fora do formato de ${f.type}`);
    if (f.type === 'reference' && !entities.has(f.entity)) errors.push(`${where}: entidade '${f.entity}' não existe`);
  }
  if (entity.singleton) errors.push(`${file}: consulta do sistema não pode ser singleton`);
  for (const a of entity.actions ?? [])
    if (a.target !== 'list') errors.push(`${file} ação '${a.name}': consulta do sistema só tem ação de lista`);
}
