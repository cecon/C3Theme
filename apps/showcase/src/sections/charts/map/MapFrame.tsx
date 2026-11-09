import { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';

// third-party
import 'maplibre-gl/dist/maplibre-gl.css';

/** Popups e botões do MapLibre com as cores do tema (no escuro eles viriam brancos). */
const frameSx = (theme: Theme) => {
  const p = theme.vars.palette;
  return {
    position: 'relative',
    height: { xs: 320, md: 420 },
    borderRadius: 2,
    overflow: 'hidden',
    border: 1,
    borderColor: 'divider',
    bgcolor: 'background.default',
    '& .maplibregl-map': { fontFamily: 'inherit' },
    '& .maplibregl-popup-content': {
      bgcolor: 'background.paper',
      color: p.text.primary,
      borderRadius: 2,
      boxShadow: theme.shadows[6],
      p: 1.5,
      pr: 3.5
    },
    '& .maplibregl-popup-close-button': { color: p.text.secondary, fontSize: 18, width: 28, height: 28 },
    '& .maplibregl-popup-anchor-bottom .maplibregl-popup-tip': { borderTopColor: p.background.paper },
    '& .maplibregl-popup-anchor-top .maplibregl-popup-tip': { borderBottomColor: p.background.paper },
    '& .maplibregl-popup-anchor-left .maplibregl-popup-tip': { borderRightColor: p.background.paper },
    '& .maplibregl-popup-anchor-right .maplibregl-popup-tip': { borderLeftColor: p.background.paper },
    '& .maplibregl-ctrl-group': { bgcolor: 'background.paper', boxShadow: theme.shadows[2] },
    '& .maplibregl-ctrl-group button + button': { borderTopColor: p.divider },
    '& .maplibregl-ctrl-scale': { bgcolor: 'background.paper', color: p.text.secondary, borderColor: p.text.secondary },
    '& .maplibregl-ctrl.maplibregl-ctrl-attrib, & .maplibregl-ctrl.maplibregl-ctrl-attrib.maplibregl-compact': {
      bgcolor: 'background.paper',
      color: p.text.secondary,
      '& a': { color: p.text.secondary }
    },
    ...theme.applyStyles('dark', {
      '& .maplibregl-ctrl button .maplibregl-ctrl-icon': { filter: 'invert(1)' },
      '& .maplibregl-ctrl-attrib-button': { filter: 'invert(1)' }
    })
  } as const;
};

interface MapFrameProps {
  /** Mostra o aviso de que o mapa base remoto não carregou. */
  offline?: boolean;
  children: ReactNode;
}

export default function MapFrame({ offline, children }: MapFrameProps) {
  return (
    <Box sx={frameSx}>
      {children}
      {offline && (
        <Typography
          variant="caption"
          role="status"
          sx={{
            position: 'absolute',
            insetInlineStart: 8,
            bottom: 8,
            maxWidth: 'calc(100% - 120px)',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            bgcolor: 'background.paper',
            color: 'text.secondary',
            boxShadow: 1,
            zIndex: 1
          }}
        >
          Mapa base indisponível: contorno simplificado.
        </Typography>
      )}
    </Box>
  );
}
