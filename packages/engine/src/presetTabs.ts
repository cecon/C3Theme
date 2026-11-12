// Presets da lista como abas (#67). Um preset sem `where` é o "Todos" que a entidade declara: não filtra nada além
// do recorte da tela e ocupa o lugar da aba "Todos" própria, que senão apareceria duas vezes.

import type { Condition, Preset, Text } from './types';

export interface PresetTab {
  id: string;
  label: Text;
  where?: Condition;
}

/** As abas: a "Todos" própria (id vazio) só quando nenhum preset já é o "Todos" (sem `where`). */
export function presetTabs(presets: readonly Preset[], allLabel: Text): PresetTab[] {
  return presets.some((p) => !p.where) ? [...presets] : [{ id: '', label: allLabel }, ...presets];
}

/** A aba selecionada: a atual se existe; senão o "Todos" (o preset sem `where`, ou a aba própria). */
export function presetTabValue(tabs: readonly PresetTab[], current: string): string {
  if (tabs.some((t) => t.id === current)) return current;
  return tabs.find((t) => !t.where)?.id ?? '';
}

/** O filtro da tela com o do preset, em `and`; preset sem `where` (ou nenhum) é só o da tela. */
export function withPreset(preset: Preset | PresetTab | undefined, parts: readonly Condition[]): Condition[] {
  return preset?.where ? [preset.where, ...parts] : [...parts];
}
