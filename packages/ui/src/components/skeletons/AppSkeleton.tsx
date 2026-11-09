// material-ui
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';

import { DRAWER_WIDTH, HEADER_HEIGHT } from '../../layout/AppLayout';
import Panel from '../Panel';
import SkeletonFrame from './SkeletonFrame';
import TableSkeletonRows from './TableSkeletonRows';
import useDelayed from './useDelayed';

/**
 * Sistema abrindo (antes do menu e das telas chegarem): barra do topo, menu lateral e uma lista.
 * No celular o menu lateral não aparece, como no layout de verdade.
 */
export default function AppSkeleton({ delay }: { delay?: number }) {
  const shown = useDelayed(true, delay);
  if (!shown) return null;
  return (
    <SkeletonFrame sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          px: 2.5,
          py: 2
        }}
      >
        <Skeleton width={140} height={36} sx={{ mb: 3 }} />
        <Stack spacing={1.5}>
          {Array.from({ length: 7 }, (_, i) => (
            <Stack key={i} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Skeleton variant="rounded" width={20} height={20} />
              <Skeleton width={`${50 + ((i * 23) % 40)}%`} />
            </Stack>
          ))}
        </Stack>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            height: HEADER_HEIGHT,
            alignItems: 'center',
            px: { xs: 2, md: 3 },
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Skeleton variant="rounded" width={32} height={32} />
          <Skeleton variant="rounded" height={36} sx={{ width: { xs: 120, sm: 220 } }} />
          <Box sx={{ flex: 1 }} />
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={36} height={36} />
        </Stack>
        <Stack spacing={2.5} sx={{ p: { xs: 2, md: 3 } }}>
          <Skeleton variant="text" sx={{ fontSize: '1.5rem', width: { xs: '50%', sm: 220 } }} />
          <Panel flush>
            <Table size="small">
              <TableBody>
                <TableSkeletonRows rows={8} columns={4} delay={0} />
              </TableBody>
            </Table>
          </Panel>
        </Stack>
      </Box>
    </SkeletonFrame>
  );
}
