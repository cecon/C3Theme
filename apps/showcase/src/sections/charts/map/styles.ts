import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';

// third-party
import type { StyleSpecification } from 'maplibre-gl';
import type { ErrorEvent } from 'react-map-gl/maplibre';

import { useIsDark } from '../palette';

export const REMOTE_STYLE = 'https://demotiles.maplibre.org/style.json';

export type BaseStyle = 'demo' | 'claro' | 'escuro';

export const BASE_STYLES: { value: BaseStyle; label: string }[] = [
  { value: 'demo', label: 'MapLibre' },
  { value: 'claro', label: 'Claro' },
  { value: 'escuro', label: 'Escuro' }
];

/** Contorno bem simplificado do Brasil (lng, lat), só para o mapa não ficar vazio sem internet. */
const BRASIL: [number, number][] = [
  [-60.0, 5.2], [-51.6, 4.2], [-50.0, 1.8], [-48.5, -1.0], [-44.3, -2.5], [-41.0, -2.9], [-38.5, -3.7], [-35.2, -5.5],
  [-34.8, -7.1], [-35.0, -9.0], [-37.0, -11.0], [-38.5, -13.0], [-39.0, -15.5], [-39.7, -19.5], [-41.0, -22.0], [-43.2, -23.0],
  [-46.3, -24.0], [-48.5, -26.5], [-48.6, -28.5], [-50.3, -30.5], [-52.1, -32.1], [-53.4, -33.7], [-55.8, -30.9], [-57.6, -30.2],
  [-55.7, -27.4], [-54.6, -25.6], [-54.3, -24.0], [-55.6, -22.6], [-57.9, -22.1], [-58.0, -19.8], [-58.2, -17.3], [-60.2, -16.3],
  [-60.1, -13.6], [-61.9, -13.4], [-65.3, -11.0], [-66.8, -9.9], [-69.5, -11.0], [-72.4, -10.0], [-73.8, -7.3], [-72.9, -5.2],
  [-70.0, -4.3], [-69.4, -1.1], [-69.8, 1.7], [-67.0, 2.0], [-66.9, 1.2], [-64.0, 2.0], [-64.5, 3.8], [-62.0, 4.2], [-60.0, 5.2]
]; // prettier-ignore

/** Estilo que não depende de rede: fundo, contorno do país e mais nada. */
function offlineStyle(c: { water: string; land: string; line: string }): StyleSpecification {
  return {
    version: 8,
    sources: {
      brasil: {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [BRASIL] } }
      }
    },
    layers: [
      { id: 'fundo', type: 'background', paint: { 'background-color': c.water } },
      { id: 'brasil-area', type: 'fill', source: 'brasil', paint: { 'fill-color': c.land } },
      { id: 'brasil-borda', type: 'line', source: 'brasil', paint: { 'line-color': c.line, 'line-width': 1.2, 'line-opacity': 0.6 } }
    ]
  };
}

// se o estilo remoto falhar uma vez, todos os mapas da página passam a usar o offline
let remoteFailed = false;
const listeners = new Set<() => void>();
function markRemoteFailed() {
  if (remoteFailed) return;
  remoteFailed = true;
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const TIMEOUT_MS = 8000;

/**
 * Estilo do mapa com plano B: tenta o estilo remoto e, se ele não carregar (sem rede, bloqueio,
 * demora demais), cai para um estilo local nas cores do tema.
 */
export function useMapStyle(base: BaseStyle) {
  const theme = useTheme();
  const dark = useIsDark();
  const failed = useSyncExternalStore(subscribe, () => remoteFailed);
  const [loaded, setLoaded] = useState(false);

  const light = theme.colorSchemes.light?.palette;
  const darkP = theme.colorSchemes.dark?.palette;
  const offline = useMemo(() => {
    const p = (base === 'escuro' || (base === 'demo' && dark) ? darkP : light) ?? theme.palette;
    return offlineStyle({ water: p.background.default, land: p.background.paper, line: p.text.secondary });
  }, [base, dark, light, darkP, theme.palette]);

  const wantsRemote = base === 'demo' && !failed;

  // estilo remoto que não respondeu a tempo conta como falha
  useEffect(() => {
    if (!wantsRemote || loaded) return;
    const t = window.setTimeout(markRemoteFailed, TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [wantsRemote, loaded]);

  const onError = useCallback(
    (e: ErrorEvent) => {
      if (wantsRemote && !e.target.isStyleLoaded()) markRemoteFailed();
    },
    [wantsRemote]
  );

  return {
    mapStyle: wantsRemote ? REMOTE_STYLE : offline,
    /** O usuário pediu o estilo remoto mas está vendo o offline. */
    usingFallback: base === 'demo' && failed,
    onError,
    onLoad: () => setLoaded(true)
  };
}
