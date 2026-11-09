import { useMemo } from 'react';

// material-ui
import Box from '@mui/material/Box';

import { qrModules, qrPath } from './qr';

/** Margem branca obrigatória do QR (4 módulos pela norma): sem ela a câmera não acha o código no tema escuro. */
const QUIET = 4;

export interface QrCodeProps {
  value: string;
  /** Lado em pixels. */
  size?: number;
  /** Nome para o leitor de tela. */
  label: string;
}

/**
 * QR Code em SVG, sempre preto sobre branco (também no tema escuro). Quando `value` muda, só o `d` do mesmo `<path>`
 * é trocado: o nó não é desmontado e o código renova sem piscar.
 */
export default function QrCode({ value, size = 232, label }: QrCodeProps) {
  const modules = useMemo(() => qrModules(value), [value]);
  const side = modules.length + QUIET * 2;
  const d = useMemo(() => qrPath(modules, QUIET), [modules]);
  return (
    <Box
      component="svg"
      role="img"
      aria-label={label}
      viewBox={`0 0 ${side} ${side}`}
      shapeRendering="crispEdges"
      sx={{ display: 'block', width: size, height: size, maxWidth: '100%', bgcolor: '#fff', borderRadius: 2 }}
    >
      <rect width={side} height={side} fill="#fff" />
      <path d={d} fill="#000" />
    </Box>
  );
}
