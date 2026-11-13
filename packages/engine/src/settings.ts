// Configurações em modal (#119): o que a spec declara vira abas/seções visíveis, linhas da busca e a seção inicial.
// Sem React: a montagem do diálogo fica em settings/SettingsModal.

import type { SettingsSearchEntry } from '@c3theme/ui';

import type { ClientPlatform, Text } from './types';
import type { SettingsDef, SettingsPageDef, SettingsRowDef, SettingsSectionDef } from './settingsTypes';

/** O que o ambiente diz para decidir o que aparece. */
export interface SettingsContext {
  platform: ClientPlatform;
  /** chaves de `pages` do GET /_meta/app: `false` esconde a seção */
  pageAccess?: Record<string, boolean>;
  capabilities?: readonly string[];
}

/** Traduz um `Text` da spec (literal ou chave de i18n). */
export type SettingsText = (value: Text | undefined, fallback?: string) => string;

function onPlatform(platforms: readonly ClientPlatform[] | undefined, platform: ClientPlatform): boolean {
  return platforms === undefined || platforms.includes(platform);
}

/** As seções visíveis na ordem da spec: plataforma filtra; a permissão nega esconde, salvo `hideWhenDenied: false`. */
export function visibleSections(def: SettingsDef, context: SettingsContext): SettingsSectionDef[] {
  return def.sections.filter(
    (section) =>
      onPlatform(section.platforms, context.platform) &&
      (section.capability === undefined || context.capabilities?.includes(section.capability) === true) &&
      !(sectionDenied(section, context) && section.hideWhenDenied !== false)
  );
}

/** A permissão da seção está negada no `pages` do backend? */
export function sectionDenied(section: SettingsSectionDef, context: SettingsContext): boolean {
  return section.permission !== undefined && context.pageAccess?.[section.permission] === false;
}

/** As linhas visíveis da seção ou página: plataforma filtra, a ordem da spec fica. */
export function visibleRows(rows: readonly SettingsRowDef[] | undefined, platform: ClientPlatform): SettingsRowDef[] {
  return (rows ?? []).filter((row) => onPlatform(row.platforms, platform));
}

/** A seção inicial: a pedida quando visível, senão a restaurada, senão a declarada, senão a primeira. */
export function initialSection(def: SettingsDef, context: SettingsContext, restored?: string): string {
  const visiveis = visibleSections(def, context).map((section) => section.id);
  for (const candidata of [restored, def.initialSection]) {
    if (candidata !== undefined && visiveis.includes(candidata)) return candidata;
  }
  return visiveis[0] ?? '';
}

/** As chaves de permissão que o modal declara, para a shell pedir o `pages` de /_meta/app. */
export function settingsPermissions(def: SettingsDef & { server?: SettingsDef }): string[] {
  const daSecao = def.sections.flatMap((section) => (section.permission === undefined ? [] : [section.permission]));
  return [...new Set([...daSecao, ...(def.server === undefined ? [] : settingsPermissions(def.server))])];
}

/** Uma página da seção pelo caminho de ids (subpágina dentro de subpágina). */
export function findPage(section: SettingsSectionDef, pageIds: readonly string[]): SettingsPageDef | undefined {
  let pages = section.pages;
  let encontrada: SettingsPageDef | undefined;
  for (const id of pageIds) {
    encontrada = pages?.find((page) => page.id === id);
    if (encontrada === undefined) return undefined;
    pages = encontrada.pages;
  }
  return encontrada;
}

/** A trilha da subpágina aberta: a seção e cada página do caminho, da raiz até a atual. */
export function pageTrail(section: SettingsSectionDef, pageIds: readonly string[]): SettingsPageDef[] {
  const trilha: SettingsPageDef[] = [];
  let pages = section.pages;
  for (const id of pageIds) {
    const page = pages?.find((candidata) => candidata.id === id);
    if (page === undefined) return trilha;
    trilha.push(page);
    pages = page.pages;
  }
  return trilha;
}

function entriesOf(
  rows: readonly SettingsRowDef[] | undefined,
  platform: ClientPlatform,
  section: string,
  page: string | undefined,
  where: string,
  text: SettingsText
): SettingsSearchEntry[] {
  return visibleRows(rows, platform).map((row) => ({
    id: row.id,
    title: text(row.title),
    ...(row.description === undefined ? {} : { description: text(row.description) }),
    ...(row.keywords === undefined ? {} : { keywords: row.keywords.map((keyword) => text(keyword)) }),
    section,
    ...(page === undefined ? {} : { page }),
    where
  }));
}

/**
 * As linhas de todas as abas e subpáginas visíveis, com onde cada uma mora. É o que a busca rankeia: o título e a
 * descrição da linha, sem o título da seção entrar no texto procurado.
 */
export function settingsEntries(
  def: SettingsDef,
  context: SettingsContext,
  text: SettingsText,
  sectionsOnly = false
): SettingsSearchEntry[] {
  return visibleSections(def, context)
    .filter((section) => !sectionDenied(section, context))
    .flatMap((section) => {
      const secao = text(section.title);
      if (sectionsOnly)
        return [
          {
            id: section.id,
            title: secao,
            section: section.id,
            where: secao,
            ...(section.description === undefined ? {} : { description: text(section.description) })
          }
        ];
      const proprias = entriesOf(section.rows, context.platform, section.id, undefined, secao, text);
      const paginas = (section.pages ?? []).flatMap((page) => entriesOfPage(page, context.platform, section.id, [], secao, text));
      return [...proprias, ...paginas];
    });
}

function entriesOfPage(
  page: SettingsPageDef,
  platform: ClientPlatform,
  section: string,
  caminho: readonly string[],
  where: string,
  text: SettingsText
): SettingsSearchEntry[] {
  const ids = [...caminho, page.id];
  const lugar = `${where} · ${text(page.title)}`;
  const proprias = entriesOf(page.rows, platform, section, ids.join('/'), lugar, text);
  const filhas = (page.pages ?? []).flatMap((filha) => entriesOfPage(filha, platform, section, ids, lugar, text));
  return [...proprias, ...filhas];
}
