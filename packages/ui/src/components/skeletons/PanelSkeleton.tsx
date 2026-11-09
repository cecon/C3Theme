// material-ui
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import type { SxProps, Theme } from '@mui/material/styles';

import Panel from '../Panel';
import SkeletonFrame from './SkeletonFrame';
import useDelayed from './useDelayed';
import { skeletonWidth } from './widths';

export interface PanelSkeletonProps {
  /** Placeholder do título do painel. */
  title?: boolean;
  /** Linhas de texto no corpo. */
  lines?: number;
  /** Bloco do tamanho de um gráfico ou imagem no corpo (em px), no lugar das linhas. */
  height?: number;
  /** ms antes de aparecer; 0 mostra na hora. */
  delay?: number;
  sx?: SxProps<Theme>;
}

/** Painel (card de painel, seção personalizada) carregando: título e linhas de texto ou um bloco de gráfico. */
export default function PanelSkeleton({ title = true, lines = 3, height, delay, sx }: PanelSkeletonProps) {
  const shown = useDelayed(true, delay);
  if (!shown) return null;
  return (
    <SkeletonFrame sx={sx}>
      <Panel title={title ? <Skeleton width={160} /> : undefined}>
        {height ? (
          <Skeleton variant="rounded" height={height} />
        ) : (
          <Stack spacing={1}>
            {Array.from({ length: lines }, (_, i) => (
              <Skeleton key={i} width={i === lines - 1 ? '40%' : skeletonWidth(i + 3)} />
            ))}
          </Stack>
        )}
      </Panel>
    </SkeletonFrame>
  );
}
