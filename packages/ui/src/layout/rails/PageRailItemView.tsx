import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router';
import type { PageRailItem } from './types';
export default function ItemDaPagina({ page, ativa }: { page: PageRailItem; ativa: boolean }) {
  const Icon = page.icon;
  return (
    <Tooltip title={page.title} enterDelay={400} placement="right">
      <ButtonBase
        component={RouterLink}
        to={page.url}
        aria-current={ativa ? 'page' : undefined}
        aria-label={page.title}
        sx={(t) => ({
          width: 44,
          height: 40,
          borderRadius: 2,
          flexDirection: 'column',
          color: ativa ? t.palette.primary.main : t.palette.text.secondary,
          bgcolor: ativa ? alpha(t.palette.primary.main, t.palette.action.selectedOpacity) : 'transparent',
          '&:hover': { bgcolor: 'action.hover' },
          '&.Mui-focusVisible': { outline: `2px solid ${t.palette.primary.main}`, outlineOffset: -2 },
          position: 'relative'
        })}
      >
        {Icon !== undefined ? (
          <Icon size={20} variant={ativa ? 'Bulk' : 'Linear'} />
        ) : (
          <Box aria-hidden sx={{ width: 20 }}>
            {page.title.trim().slice(0, 1)}
          </Box>
        )}
        {page.badge}
        {ativa && (
          <Box
            aria-hidden
            sx={{ position: 'absolute', left: 2, top: 12, width: 2, height: 16, borderRadius: 1, bgcolor: 'primary.main' }}
          />
        )}
      </ButtonBase>
    </Tooltip>
  );
}
