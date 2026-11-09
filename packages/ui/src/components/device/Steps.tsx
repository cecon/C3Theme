import type { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/** Passos numerados curtos (lista ordenada de verdade, para o leitor de tela contar). */
export default function Steps({ steps }: { steps: ReactNode[] }) {
  return (
    <Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 1.5, counterReset: 'step' }}>
      {steps.map((step, i) => (
        <Box component="li" key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Box
            aria-hidden
            sx={(theme) => ({
              flex: 'none',
              width: 24,
              height: 24,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              typography: 'caption',
              fontWeight: 600,
              bgcolor: theme.vars.palette.action.selected,
              color: theme.vars.palette.text.primary
            })}
          >
            {i + 1}
          </Box>
          <Typography variant="body2" sx={{ pt: 0.25 }}>
            {step}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
