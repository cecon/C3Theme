import { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import type { SxProps, Theme } from '@mui/material/styles';

interface TileProps {
  children: ReactNode;
  /** Ações presas no rodapé: com o cartão esticado à altura da linha, o vão fica acima delas, não abaixo. */
  footer?: ReactNode;
  sx?: SxProps<Theme>;
}

/** Cartão simples sem cabeçalho (o Panel tem cabeçalho com divisória); base dos cartões de número. */
export default function Tile({ children, footer, sx }: TileProps) {
  const hasFooter = footer !== undefined && footer !== null;
  return (
    <Paper
      variant="outlined"
      sx={[
        { borderRadius: 3, p: 2.5, height: '100%', position: 'relative', overflow: 'hidden' },
        hasFooter && { display: 'flex', flexDirection: 'column' },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    >
      {hasFooter ? <Box sx={{ flex: '1 0 auto' }}>{children}</Box> : children}
      {hasFooter && <Box sx={{ mt: 'auto', pt: 2 }}>{footer}</Box>}
    </Paper>
  );
}
