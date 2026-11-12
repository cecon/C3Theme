// Busca das configurações (`views.form.search`, #110): acha o ajuste pelo rótulo, pelo help e pelos `keywords`,
// sem acento nem maiúscula. Sem React: a caixa de busca fica em pages/autosave.

import { tabKey } from './formTabs';
import type { EntityDef, FormSection, Text } from './types';

export interface SettingEntry {
  field: string;
  label: string;
  /** Aba do ajuste (a chave de `groupSections`), quando o formulário tem abas. */
  tab?: string;
  /** Onde o ajuste mora, para mostrar no resultado ("Aparência"). */
  where?: string;
  terms: string;
}

/** Sem acento e em minúsculas: "Aparência" acha "aparencia". */
export const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const fieldsOf = (s: FormSection) => (s.rows ?? []).flat().map((c) => (typeof c === 'string' ? c : c.field));

/** Um item por campo das seções (na ordem da tela), com o texto em que a busca procura. */
export function settingEntries(
  def: EntityDef,
  sections: FormSection[],
  text: (t: Text | undefined, fallback?: string) => string
): SettingEntry[] {
  return sections.flatMap((s) =>
    fieldsOf(s).flatMap((name) => {
      const f = def.fields.find((x) => x.name === name);
      if (!f || f.denied) return [];
      const label = text(f.label, f.name);
      const words = [label, text(f.help), ...(f.keywords ?? []).map((k) => text(k))];
      const where = s.tab !== undefined ? text(s.tab) : s.title ? text(s.title) : undefined;
      return [{ field: name, label, tab: s.tab !== undefined ? tabKey(s.tab) : undefined, where, terms: fold(words.join(' ')) }];
    })
  );
}

/** Os ajustes em que cada palavra digitada aparece em algum lugar; busca vazia não acha nada. */
export function matchSettings(entries: SettingEntry[], query: string): SettingEntry[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return entries.filter((e) => words.every((w) => e.terms.includes(w)));
}
