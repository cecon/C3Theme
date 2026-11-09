import { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

import { useUiText } from '../../i18n';

// escondido da tela, lido pelo leitor de tela; em px: no sx do MUI, `width: 1` vira 100% e empurra a página
const srOnly = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  p: 0,
  m: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0
} as const;

/** "Carregando…" só para o leitor de tela; os placeholders em si ficam fora da árvore de acessibilidade. */
export function LoadingLabel({ label }: { label?: string }) {
  const t = useUiText();
  return (
    <Box component="span" role="status" sx={srOnly}>
      {label ?? t('c3.loading')}
    </Box>
  );
}

/** Área que está carregando: `aria-busy` + aviso para o leitor de tela; os blocos cinza ficam `aria-hidden`. */
export default function SkeletonFrame({ label, children, sx }: { label?: string; children: ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Box aria-busy="true">
      <LoadingLabel label={label} />
      <Box aria-hidden="true" sx={sx}>
        {children}
      </Box>
    </Box>
  );
}
