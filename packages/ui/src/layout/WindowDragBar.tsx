// Faixa que arrasta a janela de desktop sem barra de título nas telas que não têm o AppLayout (entrada, erro): sem
// ela, a janela não sai do lugar até o usuário entrar.

import Box from '@mui/material/Box';

import { dragRegionSx, resolveDesktop, type DesktopOptions } from './desktop';

export interface WindowDragBarProps {
  desktop: DesktopOptions;
}

/** Faixa fixa no topo, da altura dos botões da janela. Sem botões a desviar (Linux, moldura do sistema), nada. */
export default function WindowDragBar({ desktop }: WindowDragBarProps) {
  const { controls } = resolveDesktop(desktop);
  if (!controls) return null;
  return (
    <Box
      aria-hidden
      data-window-drag
      sx={[{ position: 'fixed', top: 0, left: 0, right: 0, height: controls.height, zIndex: 'appBar' }, dragRegionSx]}
    />
  );
}
