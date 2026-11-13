import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import GlobalStyles from '@mui/material/GlobalStyles';
import type { AgentDockPosition } from './AgentDock';

export interface AgentDockFrameProps {
  position: AgentDockPosition;
  size: number;
  dock: ReactNode;
  children: ReactNode;
}
/** Fixed strip plus reserved area. At least half the viewport remains available to the page. */
export default function AgentDockFrame({ position, size, dock, children }: AgentDockFrameProps) {
  const lateral = position === 'right';
  const extent = `min(${size}px, 50${lateral ? 'vw' : 'dvh'})`;
  const top = position === 'top' ? extent : '0px';
  const bottom = position === 'bottom' ? extent : '0px';
  const right = lateral ? extent : '0px';
  return (
    <Box
      data-agent-dock-frame
      sx={{
        pt: top,
        pb: bottom,
        pr: right,
        '--c3-shell-height': `calc(100dvh - ${top} - ${bottom})`,
        minHeight: '100dvh',
        '@media print': { p: 0 }
      }}
    >
      <GlobalStyles
        styles={{
          '.MuiDrawer-root .MuiDrawer-paper': {
            top,
            bottom,
            height: `calc(100% - ${top} - ${bottom})`,
            maxWidth: `calc(100vw - ${right})`
          },
          '.MuiDrawer-root.MuiDrawer-anchorRight > .MuiDrawer-paper': { right },
          '.MuiAppBar-root.MuiAppBar-positionSticky': { top }
        }}
      />
      {children}
      <Box
        data-agent-dock-area
        sx={{
          position: 'fixed',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          top: position === 'bottom' ? undefined : 0,
          bottom: position === 'top' ? undefined : 0,
          right: 0,
          left: lateral ? undefined : 0,
          width: lateral ? extent : undefined,
          height: lateral ? '100dvh' : extent,
          border: 1,
          borderColor: 'divider',
          '@media print': { display: 'none' }
        }}
      >
        {dock}
      </Box>
    </Box>
  );
}
