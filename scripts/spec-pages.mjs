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
