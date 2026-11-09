// material-ui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import { useTheme, type SxProps, type Theme } from '@mui/material/styles';

import Panel from '../Panel';
import SkeletonFrame from './SkeletonFrame';
import TableSkeletonRows from './TableSkeletonRows';
import useDelayed from './useDelayed';

/** Bloco do formulário: seção com campos (`lines`: quantos campos em cada linha), seção com tabela, ou barra de abas. */
export type FormSkeletonBlock = { title?: boolean; lines?: number[]; table?: number } | { tabs: number };

export interface FormSkeletonProps {
  /** Seções na ordem da tela. Sem isso, uma seção com título e três linhas. */
  blocks?: FormSkeletonBlock[];
  /** Título da página e botões à direita. */
  header?: boolean;
  /** ms antes de aparecer; 0 mostra na hora. */
  delay?: number;
  sx?: SxProps<Theme>;
}

const DEFAULT_BLOCKS: FormSkeletonBlock[] = [{ title: true, lines: [2, 2, 1] }];

function Section({ title, lines = [], table, inputHeight }: { title?: boolean; lines?: number[]; table?: number; inputHeight: number }) {
  return (
    <Panel title={title ? <Skeleton width={180} /> : undefined} flush={table !== undefined}>
      {table !== undefined ? (
        <Table size="small">
          <TableBody>
            <TableSkeletonRows rows={table} columns={3} delay={0} />
          </TableBody>
        </Table>
      ) : (
        // mesmo grid do formulário: no celular um campo por linha
        <Grid container spacing={2.5}>
          {lines.flatMap((n, l) =>
            Array.from({ length: n }, (_, i) => (
              <Grid key={`${l}-${i}`} size={{ xs: 12, md: 12 / n }}>
                <Skeleton variant="rounded" height={inputHeight} />
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Panel>
  );
}

/**
 * Formulário carregando com o formato da tela que vai abrir: seções, campos por linha, tabelas e abas.
 * O motor monta os blocos a partir da spec; fora dele, passe o formato à mão.
 */
export default function FormSkeleton({ blocks = DEFAULT_BLOCKS, header = true, delay, sx }: FormSkeletonProps) {
  const theme = useTheme();
  const shown = useDelayed(true, delay);
  if (!shown) return null;
  const inputHeight = theme.fieldHeight[theme.components?.MuiTextField?.defaultProps?.size ?? 'medium'];
  return (
    <SkeletonFrame sx={sx}>
      <Stack spacing={2.5}>
        {header && (
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
            <Skeleton variant="text" sx={{ fontSize: '1.5rem', width: { xs: '55%', sm: 260 } }} />
            <Stack direction="row" spacing={1}>
              <Skeleton variant="rounded" width={80} height={36} />
              <Skeleton variant="rounded" width={80} height={36} />
            </Stack>
          </Stack>
        )}
        {blocks.map((b, i) =>
          'tabs' in b ? (
            <Box key={i} sx={{ display: 'flex', gap: 3, borderBottom: 1, borderColor: 'divider', pb: 1.5, overflow: 'hidden' }}>
              {Array.from({ length: b.tabs }, (_, t) => (
                <Skeleton key={t} width={88} sx={{ flexShrink: 0 }} />
              ))}
            </Box>
          ) : (
            <Section key={i} {...b} inputHeight={inputHeight} />
          )
        )}
      </Stack>
    </SkeletonFrame>
  );
}
