import { useRef, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

// third-party
import { Shop } from 'iconsax-reactjs';
import Map, { FullscreenControl, MapRef, Marker, NavigationControl, Popup, ScaleControl } from 'react-map-gl/maplibre';

import { Panel, StatusChip } from '@c3theme/ui';
import { Loja, LOJAS } from '../data';
import { brl } from '../palette';
import MapFrame from './MapFrame';
import { BASE_STYLES, BaseStyle, useMapStyle } from './styles';

const BRASIL_BOUNDS: [number, number, number, number] = [-74, -34, -34, 5.5];

function Pin({ ativa, aberta }: { ativa: boolean; aberta: boolean }) {
  return (
    <Box
      sx={(theme) => ({
        width: 34,
        height: 34,
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50% 50% 50% 0',
        transform: 'rotate(-45deg)',
        bgcolor: aberta ? 'primary.main' : 'text.secondary',
        color: 'primary.contrastText',
        border: 2,
        borderColor: 'background.paper',
        boxShadow: ativa ? `0 0 0 4px rgb(${theme.vars.palette.primary.mainChannel} / 0.35)` : 2,
        cursor: 'pointer',
        transition: 'box-shadow .15s',
        '& svg': { transform: 'rotate(45deg)' }
      })}
    >
      <Shop size={16} variant="Bold" />
    </Box>
  );
}

function LojaInfo({ loja }: { loja: Loja }) {
  return (
    <Box sx={{ minWidth: 180 }}>
      <Typography variant="subtitle2">{loja.nome}</Typography>
      <Typography variant="caption" color="text.secondary" component="div">
        {loja.endereco} · {loja.cidade}/{loja.uf}
      </Typography>
      <Stack direction="row" sx={{ mt: 1, alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {brl.format(loja.vendas)}
        </Typography>
        <StatusChip label={loja.aberta ? 'Aberta' : 'Em reforma'} tone={loja.aberta ? 'success' : 'warning'} />
      </Stack>
    </Box>
  );
}

export default function StoresMap() {
  const mapRef = useRef<MapRef>(null);
  const [base, setBase] = useState<BaseStyle>('demo');
  const [ativa, setAtiva] = useState<Loja | null>(null);
  const style = useMapStyle(base);

  const focar = (loja: Loja) => {
    setAtiva(loja);
    mapRef.current?.flyTo({ center: [loja.lng, loja.lat], zoom: 9, duration: 1600 });
  };

  return (
    <Panel title="Lojas da rede" subtitle="Clique num marcador ou na lista para ver os detalhes">
      <Stack direction="row" sx={{ mb: 2, alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">
          Estilo do mapa
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={base}
          onChange={(_, v: BaseStyle | null) => v && setBase(v)}
          aria-label="Estilo do mapa"
        >
          {BASE_STYLES.map((s) => (
            <ToggleButton key={s.value} value={s.value} sx={{ px: 1.25 }}>
              {s.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }} sx={{ order: { xs: 1, md: 2 } }}>
          <MapFrame offline={style.usingFallback}>
            <Map
              ref={mapRef}
              initialViewState={{ bounds: BRASIL_BOUNDS, fitBoundsOptions: { padding: 24 } }}
              mapStyle={style.mapStyle}
              onError={style.onError}
              onLoad={style.onLoad}
              minZoom={2}
              style={{ width: '100%', height: '100%' }}
            >
              <NavigationControl position="top-right" />
              <FullscreenControl position="top-right" />
              <ScaleControl position="bottom-right" />
              {LOJAS.map((l) => (
                <Marker
                  key={l.id}
                  longitude={l.lng}
                  latitude={l.lat}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setAtiva(l);
                  }}
                >
                  <Pin ativa={ativa?.id === l.id} aberta={l.aberta} />
                </Marker>
              ))}
              {ativa && (
                <Popup
                  longitude={ativa.lng}
                  latitude={ativa.lat}
                  anchor="top"
                  offset={8}
                  onClose={() => setAtiva(null)}
                  closeOnClick={false}
                >
                  <LojaInfo loja={ativa} />
                </Popup>
              )}
            </Map>
          </MapFrame>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }} sx={{ order: { xs: 2, md: 1 } }}>
          <List
            dense
            disablePadding
            sx={{ maxHeight: { xs: 240, md: 420 }, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 2 }}
          >
            {LOJAS.map((l) => (
              <ListItemButton key={l.id} selected={ativa?.id === l.id} onClick={() => focar(l)}>
                <ListItemText primary={l.nome} secondary={`${l.cidade}/${l.uf} · ${brl.format(l.vendas)}`} />
              </ListItemButton>
            ))}
          </List>
          <Link
            component="button"
            variant="caption"
            sx={{ mt: 1 }}
            onClick={() => {
              setAtiva(null);
              mapRef.current?.fitBounds(BRASIL_BOUNDS, { padding: 24, duration: 1200 });
            }}
          >
            Ver o Brasil inteiro
          </Link>
        </Grid>
      </Grid>
    </Panel>
  );
}
