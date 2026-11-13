import type { ReactNode } from 'react';
import { iconByName, type C3Icons } from '../context';
import type { SettingsDef, SettingsPageDef, SettingsRowDef } from '../settingsTypes';
import type { SettingsValue } from './port';
const PREFIXO_DA_SECAO = 'c3.settings.section';

export function storedSection(chave: string): string | undefined {
  try {
    return window.localStorage.getItem(`${PREFIXO_DA_SECAO}.${chave}`) ?? undefined;
  } catch {
    return undefined;
  }
}

export function storeSection(chave: string, id: string): void {
  try {
    window.localStorage.setItem(`${PREFIXO_DA_SECAO}.${chave}`, id);
  } catch {
    // navegador sem armazenamento: a seção só não é restaurada
  }
}

/** Os valores iniciais: o que a spec declara, por linha, em qualquer profundidade. */
export function valoresDaSpec(def: SettingsDef): Record<string, SettingsValue> {
  const valores: Record<string, SettingsValue> = {};
  const linhas = (lista: readonly SettingsRowDef[] | undefined) => {
    for (const row of lista ?? []) {
      const control = row.control;
      if (control.type === 'switch') valores[row.id] = control.value ?? false;
      else if (control.type === 'select') valores[row.id] = control.value ?? control.options[0]?.value ?? '';
      else if (control.type === 'slider') valores[row.id] = control.value ?? control.min;
      else if (control.type === 'text') valores[row.id] = control.value ?? '';
    }
  };
  const paginas = (lista: readonly SettingsPageDef[] | undefined) => {
    for (const page of lista ?? []) {
      linhas(page.rows);
      paginas(page.pages);
    }
  };
  for (const section of def.sections) {
    linhas(section.rows);
    paginas(section.pages);
  }
  return valores;
}

export function icone(name: string | undefined, icons: C3Icons | undefined): ReactNode {
  const Icone = iconByName(name, icons);
  return Icone === undefined ? undefined : <Icone size={18} />;
}
