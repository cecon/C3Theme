import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import GlobalStyles from '@mui/material/GlobalStyles';

/** Reserva as colunas antes da casca e desloca também os drawers que o MUI coloca em portal. */
export default function ShellRailsFrame({ rails, children, topInset = 0 }: { rails: ReactNode; children: ReactNode; topInset?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setLeft(element.getBoundingClientRect().width);
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    observer?.observe(element);
    return () => observer?.disconnect();
  }, []);
  return (
    <Box
      data-shell-rails
      sx={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', height: 'var(--c3-shell-height, 100dvh)', minHeight: 0 }}
    >
      <GlobalStyles
        styles={{
          '.MuiDrawer-root.MuiDrawer-anchorLeft .MuiDrawer-paper': { left, maxWidth: `calc(100vw - ${left}px)` },
          '.MuiDrawer-root.MuiDrawer-anchorRight .MuiDrawer-paper': { maxWidth: `calc(100vw - ${left}px)` }
        }}
      />
      <Box ref={ref} sx={{ display: 'flex', minHeight: 0, overflow: 'hidden', pt: `${topInset}px` }}>
        {rails}
      </Box>
      <Box sx={{ minWidth: 0, minHeight: 0, '--c3-shell-rails-left': `${left}px` }}>{children}</Box>
    </Box>
  );
}
