// Regras do formulário que o JSON Schema não expressa: valores iniciais, largura das seções e fórmulas
// (resumo da seção e contas por linha), conferidas com o parser de referência (packages/engine/src/formulas.mjs).

import { formulaRefs, parseFormula } from '../packages/engine/src/formulas.mjs';

const NUMERIC = new Set(['integer', 'decimal']);

/** Confere a fórmula: lê, cada nome é campo numérico de `fields` (ou de `vars`) e cada `sum` é uma lista with_parent. */
function checkFormula(src, fields, vars, lists, where, errors) {
  let refs;
  try {
    refs = formulaRefs(parseFormula(src));
  } catch (e) {
    errors.push(`${where}: ${e.message}`);
    return;
  }
  for (const name of refs.own)
    if (!vars.has(name) && !NUMERIC.has(fields.get(name)?.type))
      errors.push(`${where}: '${name}' não é campo integer/decimal nem linha anterior do resumo`);
  for (const [list, names] of Object.entries(refs.lists)) {
    const child = lists.get(list);
    if (!child) {
      errors.push(`${where}: sum('${list}', ...) precisa de uma lista with_parent do formulário`);
      continue;
    }
    for (const name of names)
      if (!NUMERIC.has(child.get(name)?.type)) errors.push(`${where}: '${list}.${name}' não é campo integer/decimal`);
  }
}

export function checkForm(entity, fields, entities, file, errors) {
  checkSettings(entity, file, errors);
  const form = entity.views?.form;
  if (!form) return;
  for (const [name, value] of Object.entries(form.initial ?? {})) {
    const f = fields.get(name);
    if (!f || f.readOnly) errors.push(`${file}: views.form.initial cita '${name}', que não é campo editável`);
    else if (value && typeof value === 'object' && !['date', 'datetime'].includes(f.type))
      errors.push(`${file}: views.form.initial.${name}: data relativa só em campo date ou datetime`);
  }
  // listas with_parent do formulário, para o sum()
  const lists = new Map();
  for (const s of form.sections) {
    const child = s.related?.save === 'with_parent' && entities.get(s.related.entity)?.entity;
    if (child) lists.set(s.related.entity, new Map(child.fields.map((f) => [f.name, f])));
  }
  for (const [i, s] of form.sections.entries()) {
    const where = `${file} views.form.sections[${i}]`;
    for (const item of (s.rows ?? []).flat())
      if (item.display === 'swatches') {
        const f = fields.get(item.field);
        if (f?.type !== 'enum' || !f.options?.every((o) => o.color))
          errors.push(`${where}: display 'swatches' só vale em enum com color em todas as opções ('${item.field}')`);
      }
    const vars = new Set();
    for (const [j, line] of (s.summary ?? []).entries()) {
      checkFormula(line.value, fields, vars, lists, `${where}.summary[${j}]`, errors);
      if (line.name) vars.add(line.name);
    }
    if (s.pairing) checkPairing(entity, fields, s.pairing, `${where}.pairing`, errors);
    const childFields = s.related && lists.get(s.related.entity);
    for (const [j, c] of (s.related?.computed ?? []).entries())
      checkFormula(c.value, childFields ?? new Map(), new Set(), new Map(), `${where}.related.computed[${j}]`, errors);
  }
}

/** Seção de ligar aparelho: os campos existem e os botões são ações de registro; `code` recebe o número no input. */
function checkPairing(entity, fields, p, where, errors) {
  for (const key of ['status', 'qr', 'code', 'phone', 'account', 'error'])
    if (p[key] && !fields.has(p[key])) errors.push(`${where}.${key}: '${p[key]}' não é campo de ${entity.name}`);
  const status = fields.get(p.status);
  if (status?.type === 'enum')
    for (const v of Object.keys(p.states))
      if (!status.options.some((o) => String(o.value) === v)) errors.push(`${where}.states: '${v}' não é opção de '${p.status}'`);
  for (const [button, name] of Object.entries(p.actions ?? {})) {
    const a = (entity.actions ?? []).find((x) => x.name === name);
    if (!a || a.target === 'list') errors.push(`${where}.actions.${button}: '${name}' não é ação de registro de ${entity.name}`);
    else if (button === 'code' && !a.input?.fields?.length) errors.push(`${where}.actions.code: '${name}' precisa de input (o número)`);
    else if (button !== 'code' && (a.input || a.confirm))
      errors.push(`${where}.actions.${button}: '${name}' roda no clique (sem input nem confirm)`);
  }
}

/**
 * Configurações (#110): a busca, a confirmação e o aviso de reinício só existem na gravação na hora (autosave); fora
 * dela, não fariam nada e enganariam quem lê a spec.
 */
function checkSettings(entity, file, errors) {
  const autosave = entity.views?.form?.autosave === true;
  if (entity.views?.form?.search && !autosave) errors.push(`${file}: views.form.search só vale com views.form.autosave`);
  if (autosave) return;
  for (const f of entity.fields ?? [])
    for (const key of ['confirmChange', 'restart'])
      if (f[key] !== undefined) errors.push(`${file}: campo '${f.name}': ${key} só vale com views.form.autosave`);
}
