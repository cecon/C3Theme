// Começo do registro novo pelo formulário (views.form.initial) e linhas vazias das listas editadas no lugar.

import { browserClock, relativeValue } from './relativeDate';
import type { EntityDef, WireRecord } from './types';

/** Até quantas colunas simples a linha de uma lista with_parent é editada no lugar; acima disso, em diálogo. */
export const INLINE_MAX = 4;

/** A filha é editada na própria linha: poucos campos simples, sem texto longo, condição nem consulta. */
export function editsInline(child: EntityDef, parentField: string): boolean {
  const fields = child.fields.filter((f) => !f.readOnly && f.name !== parentField);
  return (
    !child.lookups?.length && fields.length <= INLINE_MAX && fields.every((f) => f.type !== 'text' && !f.visibleWhen && !f.requiredWhen)
  );
}

const isRelative = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && ('$date' in v || '$now' in v);

/**
 * Valores de `views.form.initial` (data relativa resolvida pelo relógio do navegador) e, em cada lista with_parent
 * editada no lugar com `minItems` (menos a checklist), essa quantidade de linhas com os padrões da filha, para o usuário já digitar.
 */
export function formStart(def: EntityDef, childDef: (entity: string) => EntityDef | undefined, now = new Date()): WireRecord {
  const out: WireRecord = {};
  for (const [name, value] of Object.entries(def.views?.form?.initial ?? {})) {
    const field = def.fields.find((f) => f.name === name);
    out[name] = isRelative(value) && field ? relativeValue(value, field.type === 'datetime', browserClock(now)) : value;
  }
  for (const s of def.views?.form?.sections ?? []) {
    const rel = s.related;
    const child = rel && childDef(rel.entity);
    if (!rel || !child || rel.save !== 'with_parent' || rel.maxItems === 1 || !rel.minItems) continue;
    // na checklist cada linha é uma opção marcada: minItems é só validação, linha vazia ficaria invisível
    if (rel.display === 'checklist') continue;
    if (!editsInline(child, rel.field)) continue;
    const blank = Object.fromEntries(child.fields.filter((f) => !f.readOnly && f.default !== undefined).map((f) => [f.name, f.default]));
    out[rel.entity] = Array.from({ length: rel.minItems }, () => ({ ...blank }));
  }
  return out;
}
