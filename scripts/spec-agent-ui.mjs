// Partes do assistente (spec/v0/agent-ui.schema.json): os exemplos de conformance/agent-ui.json contra o schema e
// contra as entidades dos exemplos (entidade, campo e ação existem; nada de senha, arquivo ou campo só leitura).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const forbidden = (f) => f.writeOnly || f.type === 'file';

// c3.tool, c3.plan e c3.browser não citam entidade: o schema basta
const ENTITY_KINDS = new Set(['c3.form', 'c3.record', 'c3.action']);

function checkPayload(part, entities, where, errors) {
  if (!ENTITY_KINDS.has(part.kind)) return;
  const p = part.payload;
  if (part.kind === 'c3.form') {
    for (const f of p.fields) if (forbidden(f)) errors.push(`${where}: campo '${f.name}' é senha ou arquivo`);
    for (const f of p.fields)
      if (f.type === 'reference' && !entities.has(f.entity)) errors.push(`${where}: '${f.name}' aponta para entidade desconhecida`);
    return;
  }
  const entity = entities.get(p.entity)?.entity;
  if (!entity) return errors.push(`${where}: entidade '${p.entity}' desconhecida`);
  if (part.kind === 'c3.record') {
    for (const k of Object.keys(p.values)) {
      const f = entity.fields.find((x) => x.name === k);
      if (!f || forbidden(f) || f.readOnly || (p.id && f.createOnly)) errors.push(`${where}: campo '${k}' não pode ser proposto`);
    }
  } else {
    const action = entity.actions?.find((a) => a.name === p.action);
    if (!action || action.target === 'list') return errors.push(`${where}: ação '${p.action}' desconhecida ou de lista`);
    for (const k of Object.keys(p.input ?? {}))
      if (!action.input?.fields.some((f) => f.name === k && !forbidden(f))) errors.push(`${where}: input '${k}' não existe na ação`);
  }
}

/** Devolve quantas partes foram conferidas. */
export function checkAgentParts(ajv, specDir, entities, errors) {
  const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
  ajv.addSchema(read(join(specDir, 'agent-ui.schema.json')), 'agent-ui.schema.json');
  const { parts } = read(join(specDir, 'conformance', 'agent-ui.json'));
  for (const part of parts) {
    const where = `conformance/agent-ui.json '${part.id}'`;
    if (!ajv.validate('agent-ui.schema.json', part)) {
      errors.push(...ajv.errors.map((e) => `${where}: ${e.instancePath || '/'} ${e.message}`));
      continue;
    }
    checkPayload(part, entities, where, errors);
  }
  return parts.length;
}
