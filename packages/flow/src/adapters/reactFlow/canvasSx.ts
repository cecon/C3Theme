import type { Theme } from '@mui/material/styles';

import type { CanvasEdgeTone } from '../../canvas/port';

/** Cor da ligação por situação: percorrida e em andamento no primário, falha no erro, o resto no tom de borda. */
export function edgeColor(theme: Theme, tone: CanvasEdgeTone): string {
  const p = theme.vars.palette;
  if (tone === 'failed') return p.error.main;
  if (tone === 'traversed' || tone === 'active') return p.primary.main;
  return p.text.disabled;
}

/** Variáveis do React Flow tiradas do tema MUI: claro e escuro seguem o tema sem `colorMode` próprio. */
export function canvasSx(theme: Theme) {
  const p = theme.vars.palette;
  return {
    '--xy-background-color': p.background.default,
    '--xy-background-pattern-color': p.divider,
    '--xy-edge-stroke': p.text.disabled,
    '--xy-edge-stroke-selected': p.primary.main,
    '--xy-connectionline-stroke': p.primary.main,
    '--xy-handle-background-color': p.background.paper,
    '--xy-handle-border-color': p.text.secondary,
    '--xy-edge-label-background-color': p.background.default,
    '--xy-edge-label-color': p.text.secondary,
    '--xy-minimap-background-color': p.background.paper,
    '--xy-minimap-mask-background-color': `color-mix(in srgb, ${p.background.default} 60%, transparent)`,
    '--xy-minimap-node-background-color': p.action.selected,
    '--xy-minimap-node-stroke-color': p.text.disabled,
    '--xy-controls-button-background-color': p.background.paper,
    '--xy-controls-button-background-color-hover': p.action.hover,
    '--xy-controls-button-color': p.text.primary,
    '--xy-controls-button-color-hover': p.text.primary,
    '--xy-controls-button-border-color': p.divider,
    '--xy-controls-box-shadow': theme.shadows[1],
    '& .react-flow__controls-button svg': { fill: 'currentColor' },
    '& .c3-flow-handle': { width: 12, height: 12, borderWidth: 2 },
    '& .react-flow__handle-connecting, & .c3-flow-handle:hover': { bgcolor: p.primary.main, borderColor: p.primary.main },
    // foco do teclado visível no nó e na ligação (o React Flow tira o contorno padrão)
    '& .react-flow__node:focus-visible': { outline: `2px solid ${p.primary.main}`, outlineOffset: 3, borderRadius: 1 },
    '& .react-flow__edge:focus-visible .react-flow__edge-path': { stroke: p.primary.main, strokeWidth: 3 },
    '& .react-flow__edge-textbg': { fill: p.background.default },
    '& .react-flow__edge-text': { fill: p.text.secondary, fontSize: 12 }
  };
}
