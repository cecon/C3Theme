// Regras do menu e das views de quadro e calendário que o JSON Schema não expressa sozinho.

import { checkEditColumn } from './spec-fields.mjs';
import { checkSource, checkStore } from './spec-source.mjs';
import { makeCheckCondition } from './spec-conditions.mjs';
import { hrefFields } from '../packages/engine/src/hrefSlots.mjs';
import { checkAccentColumns } from './spec-accents.mjs';

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
    checkCalendarColor(calendar.color, fields, field, file, errors);
    for (const name of calendar.open ? hrefFields(calendar.open.href) : []) field(name, 'views.calendar.open.href');
    for (const name of calendar.fields ?? []) field(name, 'views.calendar.fields');
  }
}

/** Totais, singleton e consulta do sistema: regras da lista que o JSON Schema não expressa. */
export function checkListRules(entity, fields, entities, file, errors, wire) {
  checkAccentColumns(entity, fields, file, errors);
  checkTotals(entity, fields, file, errors);
  checkOpening(entity, fields, file, errors);
  checkRelatedEdit(entity, entities, file, errors);
  checkPrint(entity, entities, file, errors);
  checkSingleton(entity, entities, file, errors);
  checkSource(entity, entities, file, errors, wire);
  checkStore(entity, entities, file, errors);
  checkCards(entity, fields, file, errors);
}

/** Galeria, cabeçalho com imagem e ação na linha: os campos existem e a ação roda no clique (#13). */
function checkCards(entity, fields, file, errors) {
  const { gallery, form, list } = entity.views ?? {};
  for (const [where, v] of [
    ['views.gallery', gallery],
    ['views.form.header', form?.header]
  ]) {
    if (!v) continue;
    const names = [typeof v.image === 'string' ? v.image : undefined, v.title, v.subtitle, v.chip, ...(v.caption ?? [])];
    for (const n of names.filter(Boolean)) {
      const f = fields.get(n);
      if (!f || f.writeOnly || f.type === 'file') errors.push(`${file} ${where}: '${n}' não existe ou não dá para mostrar`);
    }
    if (typeof v.image === 'string' && fields.get(v.image) && fields.get(v.image).type !== 'string')
      errors.push(`${file} ${where}.image: '${v.image}' precisa ser campo string com a URL`);
    if (v.viewer && typeof v.image !== 'string') errors.push(`${file} ${where}: viewer pede image num campo de URL`);
  }
  if (entity.singleton && gallery) errors.push(`${file}: singleton não combina com views.gallery`);
  for (const a of list?.rowActions ?? []) {
    if (typeof a !== 'object') continue;
    const def = (entity.actions ?? []).find((x) => x.name === a.action);
    if (!def || def.target === 'list' || def.input || def.confirm || def.returns)
      errors.push(`${file} views.list.rowActions: '${a.action}' não é ação de registro sem input, confirm nem arquivo`);
  }
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
    for (const side of t.measure === 'ratio' ? [t.numerator, t.denominator] : [])
      if (!['integer', 'decimal'].includes(fields.get(side)?.type))
        errors.push(`${where}: razão de '${t.field}' cita '${side}', que precisa ser campo integer ou decimal`);
    seen.add(t.field);
  }
}

/** Saldo anterior: campo integer ou decimal nas colunas, data date ou datetime, groupBy de campos que existem. */
function checkOpening(entity, fields, file, errors) {
  const o = entity.views?.list?.opening;
  if (!o) return;
  const where = `${file} views.list.opening`;
  const f = fields.get(o.field);
  if (!f || !['integer', 'decimal'].includes(f.type)) errors.push(`${where}: '${o.field}' precisa ser campo integer ou decimal`);
  if (!['date', 'datetime'].includes(fields.get(o.dateField)?.type))
    errors.push(`${where}: '${o.dateField}' precisa ser campo date ou datetime`);
  for (const g of o.groupBy ?? []) if (!fields.has(g)) errors.push(`${where}: groupBy cita campo inexistente '${g}'`);
  if (entity.singleton) errors.push(`${where}: singleton não tem lista`);
}

/** `related` com colunas editáveis, busca e presets: campos que a filha grava, e a busca e os presets que ela tem. */
function checkRelatedEdit(entity, entities, file, errors) {
  for (const s of entity.views?.form?.sections ?? []) {
    const r = s.related;
    const child = r && entities.get(r.entity)?.entity;
    if (!child) continue;
    const where = `${file} related '${r.entity}'`;
    for (const name of r.editable ?? []) {
      const f = child.fields.find((x) => x.name === name);
      if (!f || name === r.field) errors.push(`${where}.editable: '${name}' não é campo editável da filha`);
      else checkEditColumn(f, child, `${where}.editable '${name}'`, errors);
    }
    if (r.search && !child.views?.list?.search?.length) errors.push(`${where}.search: a filha não tem views.list.search`);
    if (r.presets && !child.views?.list?.presets?.length) errors.push(`${where}.presets: a filha não tem views.list.presets`);
  }
}

/** Folha impressa: posições de seção que existem e imprimem; colunas em branco de alguma related da folha. */
function checkPrint(entity, entities, file, errors) {
  const form = entity.views?.form;
  if (!form?.print) return;
  const sections = form.sections ?? [];
  const where = `${file} views.form.print`;
  for (const i of form.print.sections ?? [])
    if (!sections[i] || !(sections[i].rows || sections[i].related))
      errors.push(`${where}.sections: ${i} não é seção com campos ou related`);
  const picked = (form.print.sections ?? sections.map((_, i) => i)).map((i) => sections[i]?.related).filter(Boolean);
  const columns = new Set(picked.flatMap((r) => r.columns ?? entities.get(r.entity)?.entity.fields.map((f) => f.name) ?? []));
  for (const b of form.print.blank ?? []) if (!columns.has(b)) errors.push(`${where}.blank: '${b}' não é coluna de uma related da folha`);
}

/** Cor do evento (#65): enum pela cor da opção, ou campo com `map` (sem map, enum) e regras sobre campos que existem. */
function checkCalendarColor(color, fields, field, file, errors) {
  if (!color) return;
  const where = `${file} views.calendar.color`;
  const spec = typeof color === 'string' ? { field: color } : color;
  const f = spec.field && field(spec.field, 'views.calendar.color');
  if (f && !spec.map && f.type !== 'enum') errors.push(`${where}: '${spec.field}' sem map precisa ser enum (a cor vem das options)`);
  for (const r of spec.rules ?? []) makeCheckCondition(errors)(r.when, fields, `${where}.rules`);
}
