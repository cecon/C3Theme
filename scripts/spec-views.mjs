// Regras do menu e das views de quadro e calendário que o JSON Schema não expressa sozinho.

import { checkSource } from './spec-source.mjs';

const DATES = new Set(['date', 'datetime']);

/** Item de menu aponta para entidade, preset, view e página que existem. */
export function checkMenu(app, entities, pagePaths, errors) {
  const walk = (items) => {
    for (const item of items) {
      const where = 'app.json layout.menu';
      if (item.entity) {
        if (!app.entities?.includes(item.entity)) errors.push(`${where}: entidade '${item.entity}' fora de app.entities`);
        const views = entities.get(item.entity)?.entity.views ?? {};
        if (item.preset && !(views.list?.presets ?? []).some((p) => p.id === item.preset))
          errors.push(`${where}: preset '${item.preset}' não existe em ${item.entity}.views.list.presets`);
        if (item.view && item.view !== 'list' && !views[item.view])
          errors.push(`${where}: view '${item.view}' sem ${item.entity}.views.${item.view}`);
      }
      if ((item.badge || item.view) && !item.entity) errors.push(`${where}: badge e view só valem em item com 'entity'`);
      if (item.path && !pagePaths.has(item.path)) errors.push(`${where}: '${item.path}' não está em app.pages`);
      if (item.children) walk(item.children);
    }
  };
  for (const group of app.layout?.menu ?? []) walk(group.items ?? []);
}

/** board agrupa por enum; calendar usa datas do mesmo tipo e cor de enum; campos do cartão existem e são legíveis. */
export function checkBoardCalendar(entity, fields, file, errors) {
  const field = (name, where) => {
    const f = fields.get(name);
    if (!f || f.writeOnly || f.type === 'file') errors.push(`${file} ${where}: '${name}' não existe ou não dá para mostrar`);
    return f;
  };
  const { board, calendar } = entity.views ?? {};
  if (board) {
    const g = field(board.groupBy, 'views.board.groupBy');
    if (g && g.type !== 'enum') errors.push(`${file} views.board.groupBy: '${board.groupBy}' precisa ser enum`);
    for (const v of board.columns ?? [])
      if (g?.options && !g.options.some((o) => o.value === v))
        errors.push(`${file} views.board.columns: '${v}' não está em ${g.name}.options`);
    for (const name of board.fields ?? []) field(name, 'views.board.fields');
    const typed = (name, where, types) => {
      const f = name && field(name, where);
      if (f && !types.includes(f.type)) errors.push(`${file} ${where}: '${name}' precisa ser ${types.join(' ou ')}`);
    };
    typed(board.code, 'views.board.code', ['string', 'integer']);
    typed(board.due, 'views.board.due', ['date']);
    typed(board.assignee, 'views.board.assignee', ['reference']);
    for (const c of board.counters ?? []) typed(c.field, 'views.board.counters', ['integer']);
    if (board.done !== undefined && g && !g.options?.some((o) => o.value === board.done))
      errors.push(`${file} views.board.done: '${board.done}' não está em ${g.name}.options`);
  }
  if (calendar) {
    const s = field(calendar.start, 'views.calendar.start');
    if (s && !DATES.has(s.type)) errors.push(`${file} views.calendar.start: '${s.name}' precisa ser date ou datetime`);
    if (calendar.end) {
      const e = field(calendar.end, 'views.calendar.end');
      if (e && s && e.type !== s.type) errors.push(`${file} views.calendar.end: '${e.name}' precisa ser ${s.type}, como o start`);
    }
    if (calendar.allDay) {
      const a = field(calendar.allDay, 'views.calendar.allDay');
      if (a && a.type !== 'boolean') errors.push(`${file} views.calendar.allDay: '${a.name}' precisa ser boolean`);
      if (s && s.type !== 'datetime') errors.push(`${file} views.calendar.allDay: só vale com start datetime (date já é dia inteiro)`);
    }
    if (calendar.color && field(calendar.color, 'views.calendar.color')?.type !== 'enum')
      errors.push(`${file} views.calendar.color: '${calendar.color}' precisa ser enum`);
    for (const name of calendar.fields ?? []) field(name, 'views.calendar.fields');
  }
}

/** Totais, singleton e consulta do sistema: regras da lista que o JSON Schema não expressa. */
export function checkListRules(entity, fields, entities, file, errors, wire) {
  checkTotals(entity, fields, file, errors);
  checkSingleton(entity, entities, file, errors);
  checkSource(entity, entities, file, errors, wire);
}

/** Singleton abre direto no formulário: nada que dependa de lista de vários registros, e não é filha de ninguém. */
function checkSingleton(entity, entities, file, errors) {
  for (const s of entity.views?.form?.sections ?? [])
    if (s.related && entities.get(s.related.entity)?.entity.singleton)
      errors.push(`${file}: '${s.related.entity}' é singleton e não pode ser filha (related)`);
  if (!entity.singleton) return;
  const { board, calendar, list } = entity.views ?? {};
  for (const [has, what] of [
    [board, 'views.board'],
    [calendar, 'views.calendar'],
    [list?.presets?.length, 'presets'],
    [list?.totals?.length, 'totals'],
    [(entity.actions ?? []).some((a) => a.bulk), 'ação em lote'],
    [(entity.actions ?? []).some((a) => a.target === 'list'), 'ação de lista']
  ])
    if (has) errors.push(`${file}: singleton não combina com ${what}`);
}

/** Totais do rodapé: campo integer ou decimal que aparece como coluna da lista (as declaradas ou as 5 primeiras). */
function checkTotals(entity, fields, file, errors) {
  const list = entity.views?.list ?? {};
  const columns = (
    list.columns ??
    entity.fields
      .filter((f) => !f.writeOnly)
      .slice(0, 5)
      .map((f) => f.name)
  ).map((c) => (typeof c === 'string' ? c : c.field));
  const seen = new Set();
  for (const t of list.totals ?? []) {
    const where = `${file} views.list.totals`;
    const f = fields.get(t.field);
    if (!f || !['integer', 'decimal'].includes(f.type)) errors.push(`${where}: '${t.field}' precisa ser campo integer ou decimal`);
    else if (!columns.includes(t.field)) errors.push(`${where}: '${t.field}' não está nas colunas da lista`);
    if (seen.has(t.field)) errors.push(`${where}: '${t.field}' repetido`);
    seen.add(t.field);
  }
}
