import { useSearchParams } from 'react-router';

import type { EntityDef, Preset } from '../../types';

/** Preset da URL (o mesmo da lista): quadro e calendário mostram o mesmo recorte que a lista mostraria. */
export function useViewPreset(def: EntityDef): { preset?: Preset; presetId?: string; setPreset: (id?: string) => void } {
  const [params, setParams] = useSearchParams();
  const presets = def.views?.list?.presets ?? [];
  const presetId = params.has('preset') ? params.get('preset') || undefined : presets.find((p) => p.default)?.id;
  const preset = presets.find((p) => p.id === presetId);
  const setPreset = (id?: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('preset', id ?? '');
        return next;
      },
      { replace: true }
    );
  return { preset, presetId: preset?.id, setPreset };
}
