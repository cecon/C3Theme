import { useMemo, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

// third-party
import { Location } from 'iconsax-reactjs';
import Map, { Layer, Marker, NavigationControl, Source, ViewState } from 'react-map-gl/maplibre';
import type { CircleLayerSpecification, GeoJSONSourceSpecification, HeatmapLayerSpecification } from 'maplibre-gl';

import { notify, Panel } from '@c3theme/ui';
import { ENTREGAS } from '../data';
import { num, useIsDark } from '../palette';
import MapFrame from './MapFrame';
import { useMapStyle } from './styles';

const fmt = (n: number, casas = 4) => n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

// ---------- mapa de calor ----------

const ENTREGAS_GEO: GeoJSONSourceSpecification['data'] = {
  type: 'FeatureCollection',
  features: ENTREGAS.map(([lng, lat, pedidos]) => ({
    type: 'Feature',
    properties: { pedidos },
    geometry: { type: 'Point', coordinates: [lng, lat] }
  }))
};

// rampa sequencial de um só tom (azul), do transparente ao escuro
const heatLayer = (dark: boolean): HeatmapLayerSpecification => ({
  id: 'entregas-calor',
  type: 'heatmap',
  source: 'entregas',
  paint: {
    'heatmap-weight': ['interpolate', ['linear'], ['get', 'pedidos'], 0, 0, 1000, 1],
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 2, 1, 8, 3],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 2, 18, 8, 40],
    'heatmap-opacity': 0.85,
    'heatmap-color': dark
      ? [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,
          'rgba(57,135,229,0)',
          0.25,
          '#1d4f8f',
          0.5,
          '#3987e5',
          0.8,
          '#8dbcf3',
          1,
          '#e3efff'
        ]
      : [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,
          'rgba(42,120,214,0)',
          0.25,
          '#bcd6f5',
          0.5,
          '#6aa5ea',
          0.8,
          '#2a78d6',
          1,
          '#0d3a75'
        ]
  }
});

const circleLayer = (dark: boolean): CircleLayerSpecification => ({
  id: 'entregas-pontos',
  type: 'circle',
  source: 'entregas',
  paint: {
    'circle-radius': ['interpolate', ['linear'], ['get', 'pedidos'], 50, 4, 1000, 18],
    'circle-color': dark ? '#3987e5' : '#2a78d6',
    'circle-opacity': 0.7,
    'circle-stroke-width': 1.5,
    'circle-stroke-color': dark ? '#151B23' : '#ffffff'
  }
});

export function HeatmapMap() {
  const dark = useIsDark();
  const style = useMapStyle('demo');
  const [modo, setModo] = useState<'calor' | 'pontos'>('calor');
  const total = useMemo(() => ENTREGAS.reduce((s, e) => s + e[2], 0), []);

  return (
    <Panel
      title="Concentração de entregas"
      subtitle={`${num.format(total)} pedidos entregues no mês`}
      action={
        <ToggleButtonGroup size="small" exclusive value={modo} onChange={(_, v) => v && setModo(v)} aria-label="Forma de exibição">
          <ToggleButton value="calor">Calor</ToggleButton>
          <ToggleButton value="pontos">Pontos</ToggleButton>
        </ToggleButtonGroup>
      }
      sx={{ height: '100%' }}
    >
      <MapFrame offline={style.usingFallback}>
        <Map
          initialViewState={{ bounds: [-74, -34, -34, 5.5], fitBoundsOptions: { padding: 16 } }}
          mapStyle={style.mapStyle}
          onError={style.onError}
          onLoad={style.onLoad}
          minZoom={2}
          maxZoom={9}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" showCompass={false} />
          <Source id="entregas" type="geojson" data={ENTREGAS_GEO}>
            {modo === 'calor' ? <Layer {...heatLayer(dark)} /> : <Layer {...circleLayer(dark)} />}
          </Source>
        </Map>
      </MapFrame>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          Menos
        </Typography>
        <Box
          sx={{
            flex: 1,
            maxWidth: 200,
            height: 8,
            borderRadius: 4,
            background: dark
              ? 'linear-gradient(90deg, #1d4f8f, #3987e5, #8dbcf3, #e3efff)'
              : 'linear-gradient(90deg, #bcd6f5, #6aa5ea, #2a78d6, #0d3a75)'
          }}
        />
        <Typography variant="caption" color="text.secondary">
          Mais pedidos
        </Typography>
      </Stack>
    </Panel>
  );
}

// ---------- marcador arrastável ----------

export function DraggableMap() {
  const style = useMapStyle('demo');
  const [pos, setPos] = useState({ lng: -46.6333, lat: -23.5505 });
  const [arrastando, setArrastando] = useState(false);

  return (
    <Panel title="Marcador arrastável" subtitle="Arraste o pino para escolher o ponto de retirada" sx={{ height: '100%' }}>
      <MapFrame offline={style.usingFallback}>
        <Map
          initialViewState={{ longitude: pos.lng, latitude: pos.lat, zoom: 4 }}
          mapStyle={style.mapStyle}
          onError={style.onError}
          onLoad={style.onLoad}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />
          <Marker
            longitude={pos.lng}
            latitude={pos.lat}
            anchor="bottom"
            draggable
            onDragStart={() => setArrastando(true)}
            onDrag={(e) => setPos({ lng: e.lngLat.lng, lat: e.lngLat.lat })}
            onDragEnd={(e) => {
              setArrastando(false);
              notify(`Ponto definido em ${fmt(e.lngLat.lat, 3)}, ${fmt(e.lngLat.lng, 3)}.`, 'info');
            }}
          >
            <Box
              sx={{ color: arrastando ? 'warning.main' : 'error.main', cursor: 'grab', filter: 'drop-shadow(0 2px 2px rgb(0 0 0 / 0.35))' }}
            >
              <Location size={40} variant="Bold" />
            </Box>
          </Marker>
        </Map>
      </MapFrame>
      <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
        <Typography variant="body2">
          <Typography component="span" variant="body2" color="text.secondary">
            Latitude:{' '}
          </Typography>
          {fmt(pos.lat)}
        </Typography>
        <Typography variant="body2">
          <Typography component="span" variant="body2" color="text.secondary">
            Longitude:{' '}
          </Typography>
          {fmt(pos.lng)}
        </Typography>
      </Stack>
    </Panel>
  );
}

// ---------- interações ----------

type Interacao = 'scrollZoom' | 'dragPan' | 'dragRotate' | 'doubleClickZoom' | 'touchZoomRotate';

const INTERACOES: { key: Interacao; label: string }[] = [
  { key: 'scrollZoom', label: 'Zoom com a roda do mouse' },
  { key: 'dragPan', label: 'Arrastar para mover' },
  { key: 'dragRotate', label: 'Girar com botão direito' },
  { key: 'doubleClickZoom', label: 'Zoom com duplo clique' },
  { key: 'touchZoomRotate', label: 'Pinça no toque' }
];

export function InteractionMap() {
  const style = useMapStyle('demo');
  const [opcoes, setOpcoes] = useState<Record<Interacao, boolean>>({
    scrollZoom: true,
    dragPan: true,
    dragRotate: true,
    doubleClickZoom: true,
    touchZoomRotate: true
  });
  const [view, setView] = useState<Pick<ViewState, 'longitude' | 'latitude' | 'zoom' | 'bearing' | 'pitch'>>({
    longitude: -43.2,
    latitude: -22.9,
    zoom: 5,
    bearing: 0,
    pitch: 0
  });

  return (
    <Panel title="Controle de interações" subtitle="Ligue e desligue os gestos do mapa e acompanhe a câmera">
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <MapFrame offline={style.usingFallback}>
            <Map
              {...view}
              {...opcoes}
              onMove={(e) => setView(e.viewState)}
              mapStyle={style.mapStyle}
              onError={style.onError}
              onLoad={style.onLoad}
              style={{ width: '100%', height: '100%' }}
            >
              <NavigationControl position="top-right" visualizePitch />
            </Map>
          </MapFrame>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack>
            {INTERACOES.map((i) => (
              <FormControlLabel
                key={i.key}
                control={<Switch checked={opcoes[i.key]} onChange={(e) => setOpcoes((o) => ({ ...o, [i.key]: e.target.checked }))} />}
                label={i.label}
              />
            ))}
          </Stack>
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'action.hover', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8 }}>
            <div>latitude: {fmt(view.latitude)}</div>
            <div>longitude: {fmt(view.longitude)}</div>
            <div>zoom: {fmt(view.zoom, 2)}</div>
            <div>rotação: {fmt(view.bearing, 1)}°</div>
            <div>inclinação: {fmt(view.pitch, 1)}°</div>
          </Box>
        </Grid>
      </Grid>
    </Panel>
  );
}
