// `visibleWhen` e `access` numa seção do formulário: a seção some quando a condição não vale para o registro, e
// tudo o que ela mostra vale como escondido. Os campos herdam a condição e o `access` da seção.

import { addAccess, parseAccess } from './access';
import { type Condition, citedFields, parseCondition } from './condition';
import type { Entity } from './entity';
import { isObject } from './types';

/** Junta o `visibleWhen` de cada seção ao dos campos dela; recusa condição sobre a própria seção ou campo repetido. */
export function applySections(entity: Entity): void {
  const views = isObject(entity.raw.views) ? entity.raw.views : {};
  const form = isObject(views.form) ? views.form : {};
  const sections = Array.isArray(form.sections) ? form.sections : [];
  const names = sections.map(rowFields);
  sections.forEach((s, i) => {
    const sec = isObject(s) ? s : {};
    const access = parseAccess(sec.access);
    for (const f of entity.fields) if (names[i].includes(f.name)) addAccess(f.access, access);
    if (sec.visibleWhen === undefined || sec.visibleWhen === null) return;
    const label = `${entity.name}.views.form.sections[${i}].visibleWhen`;
    let cond: Condition;
    try {
      cond = parseCondition(sec.visibleWhen, entity);
    } catch (e) {
      throw new Error(`${label}: ${(e as Error).message}`, { cause: e });
    }
    const own = citedFields(cond).find((f) => names[i].includes(f));
    if (own !== undefined) throw new Error(`${label}: cita '${own}', que está na própria seção`);
    for (const name of names[i]) {
      if (names.some((other, j) => j !== i && other.includes(name)))
        throw new Error(`${label}: '${name}' está numa seção condicional e também em outra seção`);
      const f = entity.fields.find((x) => x.name === name);
      if (!f) continue;
      f.visibleWhen = f.visibleWhen ? { kind: 'and', items: [cond, f.visibleWhen] } : cond;
    }
  });
}

function rowFields(section: unknown): string[] {
  const rows = isObject(section) && Array.isArray(section.rows) ? section.rows : [];
  const out: string[] = [];
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    for (const item of row) {
      if (typeof item === 'string') out.push(item);
      else if (isObject(item) && typeof item.field === 'string') out.push(item.field);
    }
  }
  return out;
}
