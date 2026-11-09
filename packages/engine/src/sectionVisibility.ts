// Seção condicional (spec/README.md, "Seção condicional"): `visibleWhen` na seção vale para tudo o que ela mostra.
// A mesma regra do backend: campo de seção escondida não é validado e vai null; lista with_parent vai vazia.

import { evaluate } from './conditions.mjs';
import type { Condition, EntityDef, FieldDef, FieldType, FormSection, Text, WireRecord } from './types';

export const fieldTypes = (def: EntityDef) => Object.fromEntries(def.fields.map((f) => [f.name, f.type])) as Record<string, FieldType>;

const rowNames = (s: FormSection) => (s.rows ?? []).flat().map((item) => (typeof item === 'string' ? item : item.field));

/** Se a seção aparece para os valores atuais do formulário. */
export function sectionVisible(s: FormSection, record: WireRecord, types: Record<string, FieldType>): boolean {
  return !s.visibleWhen || evaluate(s.visibleWhen, record, types);
}

/** Condição das seções de cada campo: o campo só aparece se a seção dele aparece. */
export function sectionGates(def: EntityDef): Map<string, Condition> {
  const gates = new Map<string, Condition>();
  for (const s of def.views?.form?.sections ?? []) if (s.visibleWhen) for (const name of rowNames(s)) gates.set(name, s.visibleWhen);
  return gates;
}

/** Visibilidade de um campo do formulário: a condição da seção dele e a dele próprio. */
export function fieldVisible(f: FieldDef, record: WireRecord, types: Record<string, FieldType>, gates: Map<string, Condition>): boolean {
  const gate = gates.get(f.name);
  return (!gate || evaluate(gate, record, types)) && (!f.visibleWhen || evaluate(f.visibleWhen, record, types));
}

const filled = (v: unknown) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);

/**
 * Seções com dado gravado que o salvar vai apagar, porque ficaram escondidas (ex.: desmarcar o papel Cliente).
 * Devolve o título (ou a aba) de cada uma, para a confirmação.
 */
export function lostSections(def: EntityDef, saved: WireRecord | undefined, record: WireRecord): Text[] {
  if (!saved) return [];
  const types = fieldTypes(def);
  return (def.views?.form?.sections ?? [])
    .filter((s) => s.visibleWhen && sectionVisible(s, saved, types) && !sectionVisible(s, record, types))
    .filter((s) =>
      s.related ? s.related.save === 'with_parent' && filled(saved[s.related.entity]) : rowNames(s).some((n) => filled(saved[n]))
    )
    .map((s) => s.title ?? s.tab ?? def.label.singular);
}
