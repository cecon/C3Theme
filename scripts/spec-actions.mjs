// Ações: o input (campos, grade e disposição) e o Desfazer (`inverse`, `undoable: false`). As mesmas recusas do boot
// do c3-engine.

import { checkFieldRules } from './spec-fields.mjs';

export function checkInverse(entity, action, where, errors) {
  if (action.inverse === undefined) return;
  if (entity.undoable === false) return errors.push(`${where}: entidade com undoable false não tem Desfazer (tire o inverse)`);
  const target = (entity.actions ?? []).find((a) => a.name === action.inverse);
  if (!target) return errors.push(`${where}: inverse '${action.inverse}' não é ação desta entidade`);
  if (target.name === action.name) return errors.push(`${where}: a ação não desfaz a si mesma`);
  if (action.target === 'list' || target.target === 'list') errors.push(`${where}: ação de lista (target 'list') não tem Desfazer`);
  if (action.bulk === 'together' || target.bulk === 'together')
    errors.push(`${where}: ação em conjunto (bulk 'together') não tem Desfazer`);
  if (target.input) errors.push(`${where}: a inversa '${target.name}' roda num clique e não pode ter input`);
}

/** `summary`: somas das linhas marcadas, de campos integer ou decimal legíveis, sem repetir. */
export function checkSummary(action, fields, where, errors) {
  const seen = new Set();
  for (const { field } of action.summary ?? []) {
    const f = fields.get(field);
    if (!f || f.writeOnly || !['integer', 'decimal'].includes(f.type))
      errors.push(`${where} summary: '${field}' precisa ser campo integer ou decimal`);
    if (seen.has(field)) errors.push(`${where} summary: '${field}' repetido`);
    seen.add(field);
  }
}

/** Campos do input: as regras dos campos da entidade, sem o que só vale para registro gravado. */
function checkInputField(f, where, ctx, errors) {
  const { entities, WIRE } = ctx;
  checkFieldRules(f, `${where}: '${f.name}'`, errors);
  if (f.type === 'reference' && !entities.has(f.entity))
    errors.push(`${where}: '${f.name}' referencia entidade desconhecida '${f.entity}'`);
  if (f.default !== undefined && !WIRE[f.type](f.default)) errors.push(`${where}: default de '${f.name}' fora do formato de ${f.type}`);
}

/** Grade (`type: grid`): colunas sem file, createOnly, filter, access nem condições; readOnly só trava a célula. */
function checkGrid(g, where, ctx, errors) {
  const at = `${where} grade '${g.name}'`;
  const names = new Set(g.fields.map((c) => c.name));
  if (names.size !== g.fields.length) errors.push(`${at}: colunas repetidas`);
  if ((g.minItems ?? 0) > (g.maxItems ?? 200)) errors.push(`${at}: minItems maior que maxItems`);
  for (const c of g.fields) {
    checkInputField(c, at, ctx, errors);
    if (c.type === 'file' || c.createOnly || c.filter || c.access || c.visibleWhen || c.requiredWhen || c.readOnlyWhen)
      errors.push(`${at}: '${c.name}' não pode ser file nem ter createOnly, filter, access ou condições`);
  }
}

export function checkActionInput(input, where, ctx, errors) {
  const inputFields = new Map(input.fields.map((f) => [f.name, f]));
  if (inputFields.size !== input.fields.length) errors.push(`${where}: campos de input repetidos`);
  // condições do input citam só os campos simples: grade não tem valor comparável
  const plain = new Map([...inputFields].filter(([, f]) => f.type !== 'grid'));
  for (const f of inputFields.values()) {
    if (f.type === 'grid') {
      checkGrid(f, where, ctx, errors);
      continue;
    }
    checkInputField(f, where, ctx, errors);
    if (f.readOnly || f.createOnly || f.readOnlyWhen || f.access)
      errors.push(`${where}: '${f.name}' do input não pode ser readOnly, createOnly, readOnlyWhen nem access`);
    if (f.visibleWhen) ctx.checkCondition(f.visibleWhen, plain, `${where} ${f.name}.visibleWhen`);
    if (f.requiredWhen) ctx.checkCondition(f.requiredWhen, plain, `${where} ${f.name}.requiredWhen`);
  }
  if (!input.rows) return;
  const placed = new Set();
  for (const row of input.rows) {
    if (row.length > 1 && row.some((n) => inputFields.get(n)?.type === 'grid'))
      errors.push(`${where}: grade ocupa sozinha uma linha de input.rows`);
    for (const name of row) {
      if (!inputFields.has(name)) errors.push(`${where}: input.rows cita campo inexistente '${name}'`);
      if (placed.has(name)) errors.push(`${where}: '${name}' aparece duas vezes em input.rows`);
      placed.add(name);
    }
  }
  for (const f of inputFields.values()) if (!placed.has(f.name)) errors.push(`${where}: '${f.name}' está no input mas fora de input.rows`);
}
