// Valida os exemplos da spec contra os JSON Schemas, checa referências cruzadas
// que o JSON Schema não expressa (campo citado em view existe, entidade do menu existe...)
// e roda os casos de conformidade de condições contra o avaliador de referência.
//
// Uso: node scripts/validate-spec.mjs [pasta-com-app.json]   (padrão: spec/v0/examples)

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parse as parseYaml } from 'yaml';
import { conditionFields, evaluate } from '../packages/engine/src/conditions.mjs';
import { hrefFields } from '../packages/engine/src/hrefSlots.mjs';
import { WIRE, makeCheckCondition } from './spec-conditions.mjs';
import {
  checkAccess,
  checkChecklist,
  checkDocumentCases,
  checkEditColumn,
  checkFieldRules,
  checkOptionsFrom,
  checkRefFilter,
  notWriteOnly
} from './spec-fields.mjs';
import { checkAgentParts } from './spec-agent-ui.mjs';
import { checkDashboards } from './spec-dashboard.mjs';
import { checkActionInput, checkInverse, checkOpensForm, checkSummary } from './spec-actions.mjs';
import { checkLookups } from './spec-lookups.mjs';
import { checkPageStates } from './spec-page-states.mjs';
import { checkPages, checkWizards } from './spec-pages.mjs';
import { checkBoardCalendar, checkListRules, checkMenu } from './spec-views.mjs';
import { checkReport } from './spec-report.mjs';
import { checkMap } from './spec-map.mjs';
import { checkFlow } from './spec-flow.mjs';
import { checkForm } from './spec-form.mjs';

const specDir = resolve('spec/v0');
const dir = resolve(process.argv[2] ?? join(specDir, 'examples'));
// as partes do assistente de conformance/ citam o CRM de exemplo: numa pasta de outro sistema, não se aplicam
const isCrm = dir === join(specDir, 'examples');
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addSchema(readJson(join(specDir, 'entity.schema.json')), 'entity.schema.json');
ajv.addSchema(readJson(join(specDir, 'app.schema.json')), 'app.schema.json');

const errors = [];
const openapi = parseYaml(readFileSync(join(specDir, 'openapi.yaml'), 'utf8'));
if (!openapi.openapi?.startsWith('3.1')) errors.push('openapi.yaml: esperado OpenAPI 3.1');

const validate = (schemaId, data, file) => {
  const fn = ajv.getSchema(schemaId);
  if (!fn(data)) for (const e of fn.errors) errors.push(`${file}${e.instancePath || '/'}: ${e.message}`);
};

const checkCondition = makeCheckCondition(errors);

// ---- documentos ----

const app = readJson(join(dir, 'app.json'));
validate('app.schema.json', app, 'app.json');

const entities = new Map();
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'app.json')) {
  const entity = readJson(join(dir, file));
  validate('entity.schema.json', entity, file);
  if (entity.name && `${entity.name}.json` !== file) errors.push(`${file}: name '${entity.name}' deveria bater com o nome do arquivo`);
  entities.set(entity.name, { entity, file });
}

// coluna do pai numa filha de related: quem preenche é o motor (with_parent) ou o diálogo do pai (separately)
const parentFields = new Set(
  [...entities.values()].flatMap(({ entity }) =>
    (entity.views?.form?.sections ?? []).flatMap((s) => (s.related ? [`${s.related.entity}.${s.related.field}`] : []))
  )
);

// ---- app ----

for (const name of app.entities ?? []) if (!entities.has(name)) errors.push(`app.json: entidade '${name}' sem arquivo ${name}.json`);

const pagePaths = new Set((app.pages ?? []).map((p) => p.path));
for (const p of pagePaths)
  if (app.entities?.some((e) => p === `/${e}` || p.startsWith(`/${e}/`)))
    errors.push(`app.json: página '${p}' conflita com rota de entidade`);

checkMenu(app, entities, pagePaths, errors);
const pageSchemas = checkPages(ajv, dir, app, errors);
checkWizards(app, entities, pagePaths, errors);
checkDashboards(app, entities, checkCondition, errors);

// ---- empresa e filial (app.organization + entity.scope) ----

const scopeOf = (name) => entities.get(name)?.entity.scope ?? 'group';
if (app.organization) {
  const { company, branch } = app.organization;
  for (const [role, name, scope] of [
    ['company', company, 'group'],
    ['branch', branch, 'company']
  ]) {
    if (!app.entities?.includes(name)) errors.push(`app.json organization.${role}: '${name}' fora de app.entities`);
    else if (scopeOf(name) !== scope) errors.push(`${name}.json: entidade de organization.${role} precisa de scope '${scope}'`);
  }
} else {
  for (const { entity, file } of entities.values())
    if ((entity.scope ?? 'group') !== 'group') errors.push(`${file}: scope '${entity.scope}' exige app.organization`);
}

checkPageStates(app, entities, errors);

// ---- entidades ----

const SEARCHABLE = new Set(['string', 'text', 'email']);
const embedded = new Map(); // filha with_parent → pai
for (const { entity, file } of entities.values()) {
  const fields = new Map((entity.fields ?? []).map((f) => [f.name, f]));
  if (fields.size !== (entity.fields ?? []).length) errors.push(`${file}: nomes de campo repetidos`);
  const need = (name, where) => {
    if (!fields.has(name)) errors.push(`${file}: ${where} cita campo inexistente '${name}'`);
    return fields.get(name);
  };
  // o que mostra, filtra ou ordena valores não aceita campo só de escrita (senha)
  const readable = (name, where) => {
    const f = need(name, where);
    notWriteOnly(f, `${file} ${where}`, errors);
    return f;
  };

  if (entity.titleField) readable(entity.titleField, 'titleField');
  checkAccess(entity, fields, entities, checkCondition, file, errors);
  for (const f of fields.values()) {
    checkFieldRules(f, `${file}: '${f.name}'`, errors, app.maxUploadSize);
    checkOptionsFrom(f, [...fields.values()], `${file}: '${f.name}'`, errors);
    if (f.type === 'reference' && !entities.has(f.entity))
      errors.push(`${file}: '${f.name}' referencia entidade desconhecida '${f.entity}'`);
    else if (f.filter) checkRefFilter(f, entity, entities.get(f.entity).entity, checkCondition, `${file} ${f.name}.filter`, errors);
    if (f.default !== undefined && !WIRE[f.type](f.default)) errors.push(`${file}: default de '${f.name}' fora do formato de ${f.type}`);
    if (f.type === 'enum' && new Set(f.options.map((o) => typeof o.value)).size > 1)
      errors.push(`${file}: opções de '${f.name}' misturam texto e número`);
    if (f.type === 'enum' && new Set(f.options.map((o) => o.value)).size < f.options.length)
      errors.push(`${file}: opção repetida em '${f.name}'`);
    if (f.type === 'enum' && f.default !== undefined && !f.options.some((o) => o.value === f.default))
      errors.push(`${file}: default '${f.default}' de '${f.name}' não está em options`);
    if (f.visibleWhen) checkCondition(f.visibleWhen, fields, `${file} ${f.name}.visibleWhen`);
    if (f.requiredWhen) checkCondition(f.requiredWhen, fields, `${file} ${f.name}.requiredWhen`);
    if (f.readOnlyWhen) checkCondition(f.readOnlyWhen, fields, `${file} ${f.name}.readOnlyWhen`);
    if (f.readOnly && (f.createOnly || f.readOnlyWhen))
      errors.push(`${file}: '${f.name}' é readOnly; createOnly e readOnlyWhen não combinam`);
  }

  const list = entity.views?.list ?? {};
  for (const col of list.columns ?? []) {
    if (typeof col === 'string') readable(col, 'views.list.columns');
    else for (const name of [col.field, col.secondary, ...(col.join ?? [])]) if (name) readable(name, 'views.list.columns');
    const photoName = typeof col === 'object' && (typeof col.avatar === 'string' ? col.avatar : col.avatar?.photo);
    const photo = photoName && readable(photoName, 'views.list.columns avatar');
    if (photo && photo.type !== 'string') errors.push(`${file}: avatar '${photoName}' precisa ser campo string (endereço da foto)`);
    // `href` (#69): cada {campo} do endereço existe e pode ser lido
    for (const name of typeof col === 'object' && col.href ? hrefFields(col.href) : [])
      readable(name, `views.list.columns '${col.field}' href`);
    const toneField = typeof col === 'object' && col.tone && readable(col.tone.field, 'views.list.columns tone');
    if (toneField && !col.tone.map && toneField.type !== 'enum')
      errors.push(`${file}: tone da coluna '${col.field}' sem map precisa de campo enum (a cor vem das options)`);
    if (typeof col === 'object' && col.edit)
      checkEditColumn(fields.get(col.field), entity, `${file}: views.list.columns '${col.field}'`, errors);
  }
  const period = list.dateRange && readable(list.dateRange.field, 'views.list.dateRange');
  if (period && period.type !== 'date') errors.push(`${file}: dateRange em '${period.name}' precisa ser campo date`);
  if (list.presetTabs && !list.presets?.length) errors.push(`${file}: presetTabs sem presets`);
  for (const [part, items] of Object.entries(list.expand ?? {}))
    for (const item of items) readable(typeof item === 'string' ? item : item.field, `views.list.expand.${part}`);
  for (const name of list.search ?? []) {
    const f = readable(name, 'views.list.search');
    if (f && !SEARCHABLE.has(f.type)) errors.push(`${file}: busca em '${name}' (${f.type}); só string/text/email`);
  }
  for (const name of (list.filters ?? []).map((f) => (typeof f === 'string' ? f : f.field)))
    if (readable(name, 'views.list.filters')?.type === 'flags')
      errors.push(`${file}: filtro na barra ainda não existe para flags ('${name}')`);
  for (const s of list.defaultSort ?? []) readable(s.field, 'views.list.defaultSort');
  for (const p of list.presets ?? []) {
    // sem `where` é o "Todos" (#67): não há condição a conferir
    if (p.where) checkCondition(p.where, fields, `${file} preset '${p.id}'`, true);
    for (const [name, v] of Object.entries(p.defaults ?? {})) {
      const f = fields.get(name);
      const where = `${file} preset '${p.id}' defaults.${name}`;
      if (!f || f.readOnly) errors.push(`${where}: campo inexistente ou readOnly`);
      else if (v !== null && (!WIRE[f.type](v) || (f.type === 'enum' && !f.options.some((o) => o.value === v))))
        errors.push(`${where}: valor fora do formato trafegado de ${f.type}`);
    }
  }
  for (const [k, v] of [
    ['list', list],
    ['report', entity.views?.report ?? {}]
  ])
    for (const [i, s] of (v.rowStyles ?? []).entries()) checkCondition(s.when, fields, `${file} views.${k}.rowStyles[${i}]`);
  if (new Set((list.presets ?? []).map((p) => p.id)).size !== (list.presets ?? []).length) errors.push(`${file}: ids de preset repetidos`);

  const inForm = new Set();
  for (const section of entity.views?.form?.sections ?? [])
    for (const row of section.rows ?? [])
      for (const item of row) {
        const name = typeof item === 'string' ? item : item.field;
        const f = need(name, 'views.form');
        if (inForm.has(name)) errors.push(`${file}: '${name}' aparece duas vezes no formulário`);
        inForm.add(name);
        if (f?.readOnly) errors.push(`${file}: '${name}' é readOnly e não pode estar no formulário`);
      }
  // seção condicional: a condição não cita campo da própria seção (escondida, nada a mostraria de volta)
  for (const [i, section] of (entity.views?.form?.sections ?? []).entries()) {
    if (!section.visibleWhen) continue;
    const where = `${file} seção ${i} visibleWhen`;
    checkCondition(section.visibleWhen, fields, where);
    const own = new Set((section.rows ?? []).flat().map((item) => (typeof item === 'string' ? item : item.field)));
    for (const { field } of conditionFields(section.visibleWhen))
      if (own.has(field)) errors.push(`${where}: cita '${field}', que está na própria seção`);
  }
  // abas: seções sem `tab` antes das com `tab`, e pelo menos duas abas
  const tabKey = (t) => (t === undefined ? undefined : typeof t === 'string' ? t : t.id);
  const tabs = (entity.views?.form?.sections ?? []).map((s) => tabKey(s.tab));
  if (tabs.some((t, i) => t === undefined && tabs.slice(0, i).some((p) => p !== undefined)))
    errors.push(`${file}: seção sem 'tab' depois de seção com 'tab' (as sem aba ficam acima das abas e vêm primeiro)`);
  if (new Set(tabs.filter(Boolean)).size === 1) errors.push(`${file}: formulário com uma aba só; tire 'tab' ou crie outra aba`);
  for (const section of entity.views?.form?.sections ?? []) {
    if (!section.related) continue;
    const { entity: childName, field, columns } = section.related;
    const child = entities.get(childName)?.entity;
    if (!child) {
      errors.push(`${file}: seção related cita entidade desconhecida '${childName}'`);
      continue;
    }
    const childFields = new Map(child.fields.map((f) => [f.name, f]));
    const fk = childFields.get(field);
    if (fk?.type !== 'reference' || fk.entity !== entity.name)
      errors.push(`${file}: related '${childName}.${field}' precisa ser reference para '${entity.name}'`);
    for (const c of columns ?? []) if (!childFields.has(c)) errors.push(`${file}: related cita coluna inexistente '${childName}.${c}'`);
    const { save, sort, minItems, maxItems } = section.related;
    for (const s of (sort ?? '').split(',').filter(Boolean))
      if (!childFields.has(s.replace(/^-/, ''))) errors.push(`${file}: related sort cita campo inexistente '${childName}.${s}'`);
    checkChecklist(section.related, childFields, entities, `${file}: related '${childName}'`, errors);
    if (save !== 'with_parent') {
      if (minItems !== undefined || maxItems !== undefined) errors.push(`${file}: minItems/maxItems só valem com save 'with_parent'`);
      continue;
    }
    if (scopeOf(childName) !== scopeOf(entity.name)) errors.push(`${file}: filha with_parent '${childName}' precisa do mesmo scope do pai`);
    if ((minItems ?? 0) > (maxItems ?? 200)) errors.push(`${file}: related '${childName}' com minItems > maxItems`);
    const other = embedded.get(childName);
    if (other) errors.push(`${file}: '${childName}' já é gravada junto com '${other}' (uma filha with_parent tem um pai só)`);
    embedded.set(childName, entity.name);
  }
  checkLookups(entity, fields, file, errors);
  checkForm(entity, fields, entities, file, errors);
  checkBoardCalendar(entity, fields, file, errors);
  checkReport(entity, fields, file, errors);
  checkMap(entity, fields, file, errors);
  checkFlow(entity, fields, file, errors);
  checkListRules(entity, fields, entities, file, errors, WIRE);
  const actionNames = new Set();
  for (const a of entity.actions ?? []) {
    const where = `${file} ação '${a.name}'`;
    if (actionNames.has(a.name)) errors.push(`${where}: nome repetido`);
    actionNames.add(a.name);
    if (a.visibleWhen) checkCondition(a.visibleWhen, fields, `${where} visibleWhen`);
    checkInverse(entity, a, where, errors);
    checkSummary(a, fields, where, errors);
    checkOpensForm(entity, a, entities, where, errors);
    if (a.input) checkActionInput(a.input, where, { entities, checkCondition, WIRE }, errors);
  }
  for (const f of fields.values()) {
    if (!entity.views?.form || f.readOnly || inForm.has(f.name) || parentFields.has(`${entity.name}.${f.name}`)) continue;
    if ((f.required || f.requiredWhen) && f.default === undefined)
      errors.push(`${file}: campo obrigatório '${f.name}' fora do formulário e sem default (ninguém consegue preencher)`);
  }
}

// ---- conformidade de condições ----

const conformance = readJson(join(specDir, 'conformance', 'conditions.json'));
for (const c of conformance.cases) {
  try {
    const got = evaluate(c.where, c.record, conformance.types);
    if (got !== c.expected) errors.push(`conformance/conditions.json '${c.name}': esperado ${c.expected}, avaliador deu ${got}`);
  } catch (e) {
    errors.push(`conformance/conditions.json '${c.name}': ${e.message}`);
  }
}

const documentCases = checkDocumentCases(specDir, errors);
const agentParts = isCrm ? checkAgentParts(ajv, specDir, entities, errors) : 0;

if (errors.length) {
  console.error(`spec: ${errors.length} problema(s)\n` + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log(
  `spec: ok (app + ${entities.size} entidades em ${dir}; ${conformance.cases.length} casos de condição, ${documentCases} de documento, ${agentParts} partes do assistente, ${pageSchemas} páginas registradas)`
);
