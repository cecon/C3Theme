// Regras de um campo que o JSON Schema não expressa sozinho (usadas por validate-spec.mjs).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { documentError } from '../packages/engine/src/documents.mjs';

/** `writeOnly` (senha): só em string e nunca junto com o que faria o valor aparecer ou vazar. */
function writeOnlyRules(f, where, errors) {
  if (!f.writeOnly) return;
  if (f.type !== 'string') errors.push(`${where}: writeOnly só vale para type string`);
  if (f.readOnly || f.unique || f.default !== undefined) errors.push(`${where}: writeOnly não combina com readOnly, unique nem default`);
}

/** `format` (cpf, cnpj, cpf_cnpj): só em string, e o default precisa ser um documento válido. */
function formatRules(f, where, errors) {
  if (!f.format) return;
  if (f.type !== 'string') errors.push(`${where}: format só vale para type string`);
  else if (typeof f.default === 'string' && documentError(f.format, f.default))
    errors.push(`${where}: default não é ${f.format} válido (sem máscara)`);
}

/** `flags`: cada opção é um bit (potência de 2, sem repetir); o default só marca opções que existem. */
function flagsRules(f, where, errors) {
  if (f.type !== 'flags') return;
  const bits = f.options.map((o) => o.value);
  if (bits.some((b) => !Number.isSafeInteger(b) || b <= 0 || (b & (b - 1)) !== 0 || b > 2 ** 30))
    errors.push(`${where}: opções de flags são potências de 2 (1, 2, 4... até 2^30)`);
  if (new Set(bits).size < bits.length) errors.push(`${where}: opção de flags repetida`);
  const all = bits.reduce((a, b) => a | b, 0);
  if (Number.isSafeInteger(f.default) && (f.default & ~all) !== 0) errors.push(`${where}: default marca opção que não existe`);
}

/** `file`: `accept`/`maxSize` só nele, sem o que não faz sentido para arquivo. Na entidade, quem grava é o sistema
 * (escrita delegada, conferida na subida do motor). */
function fileRules(f, where, errors) {
  if (f.type !== 'file') {
    if (f.accept || f.maxSize) errors.push(`${where}: accept/maxSize só valem para type file`);
    return;
  }
  if (f.unique || f.default !== undefined || f.writeOnly || f.format)
    errors.push(`${where}: file não combina com unique, default, writeOnly nem format`);
}

/** Confere as regras próprias de um campo; `where` é "arquivo: 'campo'". */
export function checkFieldRules(f, where, errors) {
  writeOnlyRules(f, where, errors);
  formatRules(f, where, errors);
  flagsRules(f, where, errors);
  fileRules(f, where, errors);
}

/** Roda spec/v0/conformance/documents.json contra o validador da shell; devolve quantos casos rodaram. */
export function checkDocumentCases(specDir, errors) {
  const { cases } = JSON.parse(readFileSync(join(specDir, 'conformance', 'documents.json'), 'utf8'));
  for (const c of cases) {
    const got = documentError(c.format, c.value);
    if (got !== c.error) errors.push(`conformance/documents.json ${c.format} '${c.value}': esperado ${c.error}, deu ${got}`);
  }
  return cases.length;
}

/** Campo só de escrita não aparece em lista, busca, filtro, ordem, condição nem título. */
export function notWriteOnly(f, where, errors) {
  if (f?.writeOnly) errors.push(`${where}: '${f.name}' é writeOnly e não pode ser lido, filtrado nem ordenado`);
}

/** `display: checklist`: só em with_parent; `option` é um reference da filha (não a coluna do pai); `groupBy` é
 * campo da entidade das opções. */
export function checkChecklist(related, childFields, entities, where, errors) {
  const { display, option, groupBy, save, field } = related;
  if (display !== 'checklist') {
    if (option || groupBy) errors.push(`${where}: option/groupBy só valem com display 'checklist'`);
    return;
  }
  if (save !== 'with_parent') errors.push(`${where}: checklist só vale com save 'with_parent'`);
  const opt = childFields.get(option);
  if (!opt || opt.type !== 'reference' || option === field) {
    errors.push(`${where}: checklist precisa de 'option', um reference da filha que não seja '${field}'`);
    return;
  }
  const target = entities.get(opt.entity)?.entity;
  if (groupBy && !target?.fields.some((f) => f.name === groupBy))
    errors.push(`${where}: groupBy '${groupBy}' não é campo de '${opt.entity}'`);
}

/**
 * `filter` num reference: condição sobre a entidade apontada (`target`). Folha com `{"$field": nome}` usa o valor
 * desse campo de quem aponta (`source`, ou `id`): mesmo tipo, fora de `not`, só com eq/ne/lt/lte/gt/gte.
 * As outras folhas passam pela checagem normal de condição (`check`).
 */
export function checkRefFilter(f, source, target, check, where, errors) {
  const withId = (e) => new Map([...e.fields.map((x) => [x.name, x]), ['id', { name: 'id', type: 'reference', entity: e.name }]]);
  const [src, dst] = [withId(source), withId(target)];
  const walk = (c, negated) => {
    if (c.and || c.or) return (c.and ?? c.or).forEach((i) => walk(i, negated));
    if (c.not) return walk(c.not, true);
    const name = c.value?.$field;
    if (name === undefined) return check(c, dst, where);
    const [s, t] = [src.get(name), dst.get(c.field)];
    if (negated) errors.push(`${where}: '$field' não vale dentro de 'not' (use 'ne')`);
    if (!['eq', 'ne', 'lt', 'lte', 'gt', 'gte'].includes(c.op)) errors.push(`${where}: '$field' só vale com eq, ne, lt, lte, gt e gte`);
    if (!s || !t) errors.push(`${where}: '${name}' ou '${c.field}' não existe`);
    else if (s.type !== t.type || (t.type === 'reference' && s.entity !== t.entity))
      errors.push(`${where}: '${name}' e '${c.field}' precisam ser do mesmo tipo (e apontar para a mesma entidade)`);
  };
  if (f.filter) walk(f.filter, false);
}

/**
 * Permissão (`access` em campo e seção, `rowAccess` na entidade, que pode citar o usuário com `$user`). Campo required com access precisa de default (quem
 * não pode alterar não teria como preencher); filha with_parent ainda não aceita access nos campos nem rowAccess.
 */
export function checkAccess(entity, fields, entities, check, file, errors) {
  for (const f of fields.values())
    if (f.access && f.required && f.default === undefined) errors.push(`${file}: '${f.name}' tem access e é required; precisa de default`);
  // `{"$user": chave}` vem do usuário logado: só com eq/ne/in; o resto da folha se confere como campo vazio
  const probe = (c, where) => {
    if (c.and || c.or) return { [c.and ? 'and' : 'or']: (c.and ?? c.or).map((x) => probe(x, where)) };
    if (c.not) return { not: probe(c.not, where) };
    if (c.value?.$user === undefined) return c;
    if (!['eq', 'ne', 'in'].includes(c.op)) errors.push(`${where}: $user só vale com eq, ne e in`);
    return { field: c.field, op: 'null', value: true };
  };
  for (const [i, r] of (entity.rowAccess ?? []).entries()) {
    const where = `${file} rowAccess[${i}].where`;
    check(probe(r.where, where), fields, where);
  }
  for (const s of entity.views?.form?.sections ?? []) {
    if (s.related?.save !== 'with_parent') continue;
    const child = entities.get(s.related.entity)?.entity;
    if (child && (child.rowAccess || child.fields.some((f) => f.access)))
      errors.push(`${file}: '${child.name}' é with_parent; filha ainda não aceita access nos campos nem rowAccess`);
  }
}
