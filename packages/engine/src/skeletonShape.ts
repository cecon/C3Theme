// Formato dos placeholders de carregamento a partir da spec: a tela que carrega já mostra as colunas, as seções,
// os campos por linha e as abas que vão aparecer.

import type { FormSkeletonBlock, SkeletonCell } from '@c3theme/ui';

import { groupSections } from './formTabs';
import type { EntityDef, FieldDef, FormSection } from './types';

/** Célula do placeholder da lista: enum vira chip (como a coluna de verdade), o resto é texto. */
export function columnCell(field: FieldDef | undefined): SkeletonCell {
  return field?.type === 'enum' ? 'chip' : 'text';
}

const ROWS_IN_TABLE = 3;

function sectionBlock(def: EntityDef, s: FormSection, fixed: string[]): FormSkeletonBlock | undefined {
  const title = s.title !== undefined;
  if (s.related) {
    // filha de uma linha mostra os campos direto na seção; as outras são tabela ou checklist
    if (s.related.save === 'with_parent' && s.related.maxItems === 1) return { title: true, lines: [2, 2] };
    return { title: true, table: ROWS_IN_TABLE };
  }
  if (s.component) return { title, lines: [1, 1] };
  // campo condicional pode não aparecer: fica de fora para a tela não "encolher" quando os dados chegam
  const fields = new Map(def.fields.map((f) => [f.name, f]));
  const lines = (s.rows ?? [])
    .map(
      (row) =>
        row.filter((item) => {
          const name = typeof item === 'string' ? item : item.field;
          const f = fields.get(name);
          return f && !f.visibleWhen && !fixed.includes(name);
        }).length
    )
    .filter((n) => n > 0);
  return lines.length ? { title, lines } : undefined;
}

/**
 * Blocos do placeholder do formulário: as seções de cima, a barra de abas (se houver mais de uma) e as seções da
 * primeira aba, que é a que abre, e o painel dos campos só leitura. Seções condicionais (`visibleWhen`) ficam de
 * fora: o registro ainda não chegou.
 */
export function formBlocks(def: EntityDef, sections: FormSection[], fixed: string[] = []): FormSkeletonBlock[] {
  const { head, tabs } = groupSections(sections.filter((s) => !s.visibleWhen));
  const block = (s: FormSection) => sectionBlock(def, s, fixed);
  const opening = tabs[0]?.sections ?? [];
  const out = tabs.length > 1 ? [...head.map(block), { tabs: tabs.length }, ...opening.map(block)] : [...head, ...opening].map(block);
  // campos só leitura (criado em, alterado por) vão num painel no fim, dois por linha
  const readOnly = def.fields.filter((f) => f.readOnly && !f.denied).length;
  if (readOnly) out.push({ lines: Array.from({ length: Math.ceil(readOnly / 2) }, (_, i) => Math.min(2, readOnly - i * 2)) });
  return out.filter((b): b is FormSkeletonBlock => b !== undefined);
}
