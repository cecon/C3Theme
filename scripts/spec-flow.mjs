// Regras do editor de fluxo (views.flow) que o JSON Schema não expressa sozinho.

const repeated = (list, key) => {
  const seen = new Set();
  return list.map((x) => x[key]).filter((v) => (seen.has(v) ? true : (seen.add(v), false)));
};

/** O grafo mora num campo text gravável; tipos, saídas e chaves sem repetir; summary e loopLimit citam um campo do passo. */
export function checkFlow(entity, fields, file, errors) {
  const flow = entity.views?.flow;
  if (!flow) return;
  const where = `${file} views.flow`;
  const f = fields.get(flow.field);
  if (!f || f.type !== 'text') errors.push(`${where}.field: '${flow.field}' precisa ser um campo text da entidade`);
  else if (f.readOnly || f.writeOnly) errors.push(`${where}.field: '${flow.field}' precisa ser gravável e legível`);
  const columns = (entity.views?.list?.columns ?? []).map((c) => (typeof c === 'string' ? c : c.field));
  if (columns.includes(flow.field)) errors.push(`${where}.field: '${flow.field}' é o JSON do grafo e não vai em views.list.columns`);
  if (entity.source === 'system') errors.push(`${file}: consulta do sistema (só leitura) não combina com views.flow`);
  for (const t of repeated(flow.kinds, 'type')) errors.push(`${where}.kinds: tipo '${t}' repetido`);
  for (const kind of flow.kinds) checkKind(kind, `${where}.kinds '${kind.type}'`, errors);
}

function checkKind(kind, where, errors) {
  const keys = new Map((kind.fields ?? []).map((x) => [x.key, x]));
  for (const p of repeated(kind.outputs ?? [], 'id')) errors.push(`${where}: saída '${p}' repetida`);
  for (const k of repeated(kind.fields ?? [], 'key')) errors.push(`${where}: campo '${k}' repetido`);
  for (const x of kind.fields ?? []) {
    const select = x.kind === 'select';
    if (select !== Boolean(x.options))
      errors.push(`${where}: campo '${x.key}' ${select ? 'select sem options' : 'com options sem ser select'}`);
  }
  if (kind.summary && !keys.has(kind.summary)) errors.push(`${where}.summary: '${kind.summary}' não está em fields`);
  if (kind.loopLimit && keys.get(kind.loopLimit)?.kind !== 'number')
    errors.push(`${where}.loopLimit: '${kind.loopLimit}' precisa ser um campo number do passo`);
}
