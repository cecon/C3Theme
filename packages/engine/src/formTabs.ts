// Abas do formulário (spec/README.md, "Abas no formulário"): agrupa as seções por `tab` e conta os erros de cada aba.

import type { FormSection, Text } from './types';

export interface FormTab {
  key: string;
  label: Text;
  sections: FormSection[];
}

export const tabKey = (t: Text) => (typeof t === 'string' ? t : t.id);

/** Seções sem `tab` (acima das abas) e as abas, na ordem da primeira seção de cada uma. */
export function groupSections(sections: FormSection[]): { head: FormSection[]; tabs: FormTab[] } {
  const head: FormSection[] = [];
  const tabs: FormTab[] = [];
  for (const s of sections) {
    if (s.tab === undefined) {
      head.push(s);
      continue;
    }
    const key = tabKey(s.tab);
    const tab = tabs.find((t) => t.key === key);
    if (tab) tab.sections.push(s);
    else tabs.push({ key, label: s.tab, sections: [s] });
  }
  return { head, tabs };
}

/** Chaves de erro que a seção mostra: os campos das linhas e a lista da filha (`itens`, `itens.2.ean`). */
function ownedNames(s: FormSection): string[] {
  if (s.related) return [s.related.entity];
  return (s.rows ?? []).flat().map((item) => (typeof item === 'string' ? item : item.field));
}

/** Quantos erros caem nas seções da aba. */
export function errorCount(tab: FormTab, errors: Record<string, string>): number {
  const names = new Set(tab.sections.flatMap(ownedNames));
  return Object.keys(errors).filter((k) => names.has(k.split('.')[0])).length;
}
