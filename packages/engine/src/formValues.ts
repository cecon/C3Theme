// Estado do formulário ↔ corpo do POST/PATCH (spec/v0/openapi.yaml, RecordInput).

import { readFilters } from './pages/list/readFilters';
import { formStart } from './formStart';
import { fieldTypes, sectionVisible } from './sectionVisibility';
import type { EntityDef, FieldDef, RelatedDef, Text, WireRecord } from './types';

/** Valores iniciais do registro novo: o `default` de cada campo e, criando a partir de um preset, os `defaults` dele. */
export function defaults(def: EntityDef, preset?: string | null): WireRecord {
  const own = Object.fromEntries(def.fields.filter((f) => !f.readOnly && f.default !== undefined).map((f) => [f.name, f.default]));
  return { ...own, ...def.views?.list?.presets?.find((p) => p.id === preset)?.defaults };
}

/**
 * Registro novo: os padrões, o começo do formulário (`views.form.initial` e as linhas vazias), os `defaults` do
 * preset ativo (`?preset=` na URL de "Adicionar") e, num formulário embutido, os valores do diálogo. Embutido
 * ignora o preset: a URL é da página de fora.
 */
export function initialRecord(
  def: EntityDef,
  preset: string | null,
  embedded?: { initial?: WireRecord; fixed?: WireRecord },
  childDef: (entity: string) => EntityDef | undefined = () => undefined
): WireRecord {
  const fromPreset = embedded ? undefined : def.views?.list?.presets?.find((p) => p.id === preset)?.defaults;
  return { ...defaults(def), ...formStart(def, childDef), ...fromPreset, ...embedded?.initial, ...embedded?.fixed };
}

/** Valores iniciais na URL do registro novo (`f.<campo>=valor`, o formato dos filtros da lista); readOnly fica de fora. */
export function urlValues(params: URLSearchParams, fields: FieldDef[]): WireRecord {
  const conds = readFilters(params, fields) as { field: string; value: unknown }[];
  return Object.fromEntries(conds.filter((c) => !fields.find((f) => f.name === c.field)?.readOnly).map((c) => [c.field, c.value]));
}

/** Texto de criar: `label.new` ("Nova fatura") ou "Adicionar" + singular. */
export function newLabel(def: EntityDef, text: (t: Text) => string): string {
  return def.label.new ? text(def.label.new) : `Adicionar ${text(def.label.singular).toLowerCase()}`;
}

/** Rota de "Adicionar", levando o preset ativo da lista. */
export function newRecordPath(entity: string, preset?: string): string {
  return `/${entity}/new${preset ? `?preset=${encodeURIComponent(preset)}` : ''}`;
}

/** Seções cujos filhos são gravados junto com o pai. */
export function withParent(def: EntityDef): RelatedDef[] {
  return (def.views?.form?.sections ?? []).flatMap((s) => (s.related?.save === 'with_parent' ? [s.related] : []));
}

/** Campos de um registro: sem readOnly, reference só com id, escondido vai null. */
function fieldsInput(fields: FieldDef[], record: WireRecord, visible: (f: FieldDef) => boolean): WireRecord {
  const out: WireRecord = {};
  for (const f of fields) {
    if (f.readOnly) continue;
    let v = record[f.name] ?? null;
    if (!visible(f)) v = null;
    if (f.type === 'reference' && v && typeof v === 'object') v = (v as { id: string }).id;
    out[f.name] = v;
  }
  return out;
}

/**
 * Corpo do POST/PATCH. Cada lista `with_parent` vai inteira (substitui a gravada): linha com id altera, sem id
 * inclui. A coluna do pai e as chaves `_` do motor não vão.
 */
export function toInput(
  def: EntityDef,
  record: WireRecord,
  visible: (f: FieldDef) => boolean,
  childDef: (entity: string) => EntityDef | undefined
): WireRecord {
  const out = fieldsInput(def.fields, record, visible);
  const types = fieldTypes(def);
  for (const s of def.views?.form?.sections ?? []) {
    const rel = s.related;
    // lista que o usuário só lê não vai no corpo (o backend recusaria)
    if (rel?.save !== 'with_parent' || rel.denied) continue;
    // seção escondida: a lista vai vazia e o backend exclui o gravado
    if (!sectionVisible(s, record, types)) {
      out[rel.entity] = [];
      continue;
    }
    const child = childDef(rel.entity);
    if (!child) continue;
    const fields = child.fields.filter((f) => f.name !== rel.field);
    let rows = (record[rel.entity] as WireRecord[] | undefined) ?? [];
    // filha de uma linha obrigatória nunca preenchida: vai a linha vazia, para os erros caírem nos campos dela
    if (rows.length === 0 && rel.maxItems === 1 && (rel.minItems ?? 0) >= 1) rows = [defaults(child)];
    out[rel.entity] = rows.map((row) => ({ ...(row.id ? { id: row.id } : {}), ...fieldsInput(fields, row, () => true) }));
  }
  return out;
}

/**
 * Campos de uma filha em linhas de até 4, para mostrá-la como campos (`maxItems: 1`): as `rows` do formulário
 * dela, se houver, sem a coluna do pai; os campos que sobrarem, dois por linha. `readOnly` entra (só para ler).
 */
export function childLayout(def: EntityDef, parentField: string): FieldDef[][] {
  const shown = def.fields.filter((f) => f.name !== parentField);
  const byName = (n: string) => shown.find((f) => f.name === n);
  const lines = (def.views?.form?.sections ?? [])
    .flatMap((s) => s.rows ?? [])
    .map((row) => row.map((item) => byName(typeof item === 'string' ? item : item.field)).filter((f): f is FieldDef => Boolean(f)))
    .filter((line) => line.length > 0);
  const placed = new Set(lines.flat().map((f) => f.name));
  const rest = shown.filter((f) => !placed.has(f.name));
  for (let i = 0; i < rest.length; i += 2) lines.push(rest.slice(i, i + 2));
  return lines;
}

/** Erros da linha `index` de uma lista (`itens.2.ean` → { ean }). */
export function rowErrors(errors: Record<string, string>, key: string, index: number): Record<string, string> {
  const prefix = `${key}.${index}.`;
  return Object.fromEntries(Object.entries(errors).flatMap(([k, v]) => (k.startsWith(prefix) ? [[k.slice(prefix.length), v]] : [])));
}
