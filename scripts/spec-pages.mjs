// Página registrada (app.json pages[] com component): o `config` é validado pelo schema que o próprio componente
// publica em components/<component>.schema.json, ao lado do app.json. O componente é código do sistema; o que varia
// por loja (teclas, colunas, textos) fica no config e passa por aqui.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function checkPages(ajv, dir, app, errors) {
  let checked = 0;
  for (const page of app.pages ?? []) {
    if (!page.component) continue;
    const where = `app.json página '${page.path}'`;
    const file = join(dir, 'components', `${page.component}.schema.json`);
    if (!existsSync(file)) {
      if (page.config) errors.push(`${where}: config sem schema do componente (crie components/${page.component}.schema.json)`);
      continue;
    }
    let validate;
    try {
      validate = ajv.compile(JSON.parse(readFileSync(file, 'utf8')));
    } catch (e) {
      errors.push(`components/${page.component}.schema.json: schema inválido: ${e.message}`);
      continue;
    }
    checked += 1;
    if (!validate(page.config ?? {})) for (const e of validate.errors) errors.push(`${where} config${e.instancePath || ''}: ${e.message}`);
  }
  return checked;
}

/** Assistente (`pages[].wizard`): entidade singleton, campos que existem, ação de registro sem input, uma guarda só. */
export function checkWizards(app, entities, pagePaths, errors) {
  const pages = (app.pages ?? []).filter((p) => p.wizard);
  if (pages.filter((p) => p.wizard.pending).length > 1) errors.push('app.json pages: só um assistente pode ter pending (a guarda)');
  for (const { path, wizard: w } of pages) {
    const where = `app.json página '${path}' wizard`;
    const entity = entities.get(w.entity)?.entity;
    if (!entity || !app.entities?.includes(w.entity)) {
      errors.push(`${where}: entidade '${w.entity}' fora de app.entities`);
      continue;
    }
    if (!entity.singleton) errors.push(`${where}: '${w.entity}' precisa ser singleton`);
    const field = (name) => entity.fields.find((f) => f.name === name);
    const boolean = (name, what) => field(name)?.type === 'boolean' || errors.push(`${where}.${what}: '${name}' precisa ser campo boolean`);
    if (w.pending) boolean(w.pending, 'pending');
    w.steps.forEach((s, i) => {
      for (const c of s.rows.flat()) {
        const name = typeof c === 'string' ? c : c.field;
        if (!field(name) || field(name).writeOnly) errors.push(`${where}.steps[${i}]: '${name}' não é campo de ${w.entity}`);
      }
      const a = s.action && (entity.actions ?? []).find((x) => x.name === s.action);
      if (s.action && (!a || a.target === 'list' || a.input || a.confirm))
        errors.push(`${where}.steps[${i}].action: '${s.action}' não é ação de registro sem input nem confirm`);
    });
    for (const item of w.summary?.items ?? []) {
      if (item.done) boolean(item.done, 'summary.done');
      const entityRoute = app.entities?.includes(item.path.split('/')[1]);
      if (!pagePaths.has(item.path) && !entityRoute) errors.push(`${where}.summary: '${item.path}' não é página nem entidade do app`);
    }
  }
}
