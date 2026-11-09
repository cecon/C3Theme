import type { ReactNode } from 'react';

import Box from '@mui/material/Box';

import { resolveDesktop, type DesktopPlatform } from '@c3theme/ui';

// só desenho: os botões de verdade são da janela (Electron), por cima da página
function MacButtons() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', pl: '20px', height: '100%' }}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
        <Box key={c} sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: c, boxShadow: 'inset 0 0 0 0.5px rgb(0 0 0 / 0.2)' }} />
      ))}
    </Box>
  );
}

// tinta leve da cor de marca sobre o fundo do modo, para o texto do menu continuar legível nos dois modos
const mix = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, var(--mui-palette-background-default))`;

const line = { position: 'absolute', bgcolor: 'currentColor' } as const;

function WindowsButtons() {
  return (
    <Box sx={{ display: 'flex', height: '100%', color: 'text.primary' }}>
      <Box sx={{ width: 46, position: 'relative' }}>
        <Box sx={{ ...line, width: 10, height: '1px', left: 18, top: 16 }} />
      </Box>
      <Box sx={{ width: 46, position: 'relative' }}>
        <Box sx={{ position: 'absolute', width: 10, height: 10, left: 18, top: 11, border: '1px solid currentColor' }} />
      </Box>
      <Box sx={{ width: 46, position: 'relative' }}>
        {[45, -45].map((deg) => (
          <Box key={deg} sx={{ ...line, width: 13, height: '1px', left: 16, top: 16, transform: `rotate(${deg}deg)` }} />
        ))}
      </Box>
    </Box>
  );
}

/**
 * Simula a janela do app de desktop no Storybook: um fundo colorido no lugar da `vibrancy` (aparece pelo menu
 * translúcido) e os botões da janela desenhados no canto, com a área reservada tracejada.
 */
export default function WindowFrame({ platform, children }: { platform: DesktopPlatform; children: ReactNode }) {
  const controls = resolveDesktop({ platform }).controls;
  return (
    <Box
      sx={(t) => ({
        minHeight: '100vh',
        background: `linear-gradient(160deg, ${mix(t.vars.palette.primary.main, 18)}, ${mix(t.vars.palette.secondary.main, 8)})`
      })}
    >
      {children}
      {controls && (
        <Box
          aria-hidden
          sx={{
            position: 'fixed',
            top: 0,
            [controls.side]: 0,
            width: controls.width,
            height: controls.height,
            outline: '1px dashed',
            outlineColor: 'divider',
            outlineOffset: -1,
            zIndex: (t) => t.zIndex.tooltip,
            pointerEvents: 'none'
          }}
        >
          {platform === 'mac' ? <MacButtons /> : <WindowsButtons />}
        </Box>
      )}
    </Box>
  );
}
