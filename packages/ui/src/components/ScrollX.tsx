import { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';

/** Rolagem horizontal para tabelas e conteúdos largos no celular, sem estourar o layout. */
export default function ScrollX({ children }: { children: ReactNode }) {
  return <Box sx={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>{children}</Box>;
}
