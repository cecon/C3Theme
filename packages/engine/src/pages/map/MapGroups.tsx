import type { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { MapGroup } from '../../map';
import type { WireRecord } from '../../types';

/** Caixas aninhadas da planta (ilha → bomba): título e, dentro, os blocos ou as caixas do nível de baixo. */
export default function MapGroups({
  groups,
  render,
  level = 0
}: {
  groups: MapGroup[];
  render: (rows: WireRecord[]) => ReactNode;
  level?: number;
}) {
  // sem groupBy: uma caixa sem título, só os blocos
  if (groups.length === 1 && groups[0].label === '' && level === 0 && groups[0].children.length === 0) return render(groups[0].rows);
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: level ? 1 : 2, alignItems: 'flex-start' }}>
      {groups.map((g, i) => (
        <Box
          key={`${g.label}-${i}`}
          role="group"
          aria-label={g.label}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 1.5,
            bgcolor: level ? 'background.paper' : 'action.hover',
            minWidth: 160,
            flex: level ? '0 1 auto' : '1 1 280px'
          }}
        >
          <Typography variant={level ? 'subtitle2' : 'subtitle1'} sx={{ mb: 1 }}>
            {g.label}
          </Typography>
          {g.children.length ? <MapGroups groups={g.children} render={render} level={level + 1} /> : render(g.rows)}
        </Box>
      ))}
    </Box>
  );
}
