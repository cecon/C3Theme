// Lista do painel com abas e filtro no cartão, aviso com soma e KPI com variação (#64): regras que o schema não expressa.

/** O campo do `filter` existe e é enum ou boolean. */
function checkFilter(name, entity, where, errors) {
  const f = (entity.fields ?? []).find((x) => x.name === name);
  if (!f || f.writeOnly) errors.push(`${where} filter: '${name}' não existe em ${entity.name}`);
  else if (f.type !== 'enum' && f.type !== 'boolean') errors.push(`${where} filter: '${name}' precisa ser enum ou boolean`);
}

/**
 * Cada aba lê entidade do app, com preset, colunas, ordem e filtro que existem nela; o `bind` do widget vale em todas,
 * então o campo ligado também precisa existir em cada uma. Sem abas, só o `filter` (o resto já é conferido).
 */
export function checkListTabs(app, entities, w, entity, where, checkCondition, errors) {
  if (!w.tabs) {
    if (w.filter) checkFilter(w.filter, entity, where, errors);
    return;
  }
  for (const [i, t] of w.tabs.entries()) {
    const at = `${where} tabs[${i}]`;
    const name = t.entity ?? w.entity;
    const e = entities.get(name)?.entity;
    if (!app.entities?.includes(name) || !e) {
      errors.push(`${at}: entidade '${name}' fora de app.entities`);
      continue;
    }
    const fields = new Map((e.fields ?? []).map((f) => [f.name, f]));
    const has = (n, what) => {
      const f = fields.get(n);
      if (!f || f.writeOnly || f.type === 'file') errors.push(`${at} ${what}: '${n}' não existe ou não dá para mostrar em ${name}`);
    };
    if (t.preset && !(e.views?.list?.presets ?? []).some((p) => p.id === t.preset))
      errors.push(`${at}: preset '${t.preset}' não existe em ${name}.views.list.presets`);
    if (t.where) checkCondition(t.where, fields, `${at} where`, true);
    const columns = t.columns ?? w.columns;
    for (const c of columns ?? []) has(c, 'columns');
    if (!columns && !e.titleField) errors.push(`${at}: sem columns, a entidade precisa de titleField`);
    for (const key of (t.sort ?? w.sort ?? '').split(',').filter(Boolean))
      if (key.replace(/^-/, '') !== 'id') has(key.replace(/^-/, ''), 'sort');
    for (const target of Object.values(w.bind ?? {})) has(target, 'bind');
    if (w.filter) checkFilter(w.filter, e, at, errors);
  }
}

/** `{value}` no aviso pede `measure`; o recorte do `compare` do KPI usa preset e filtro que existem. */
export function checkAlertCompare(w, entity, fields, where, checkCondition, errors) {
  if (w.type === 'alert' && JSON.stringify(w.text).includes('{value}') && !w.measure)
    errors.push(`${where}: '{value}' no texto pede measure (ex.: 'sum:valor')`);
  const c = w.type === 'kpi' ? w.compare : undefined;
  if (!c) return;
  if (c.preset && !(entity.views?.list?.presets ?? []).some((p) => p.id === c.preset))
    errors.push(`${where} compare: preset '${c.preset}' não existe em ${w.entity}.views.list.presets`);
  if (c.where) checkCondition(c.where, fields, `${where} compare.where`, true);
}
