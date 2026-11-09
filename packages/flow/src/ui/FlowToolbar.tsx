import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import { Add, Hierarchy } from 'iconsax-reactjs';

import { StatusChip } from '@c3theme/ui';

import type { NodeRunStatus } from '../core/types';
import { STATUS_TONE, type FlowNodeKind } from './kinds';
import type { FlowText } from './text';

export interface FlowToolbarProps {
  kinds: FlowNodeKind[];
  readOnly: boolean;
  issueCount: number;
  summary?: Record<NodeRunStatus, number>;
  t: FlowText;
  onAdd: (kind: FlowNodeKind) => void;
  onLayout: () => void;
}

const LIVE: NodeRunStatus[] = ['running', 'waiting', 'failed', 'done'];

/** Barra do editor: adicionar passo (menu com os tipos do app), organizar e o resumo de problemas e execução. */
export default function FlowToolbar({ kinds, readOnly, issueCount, summary, t, onAdd, onLayout }: FlowToolbarProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <Stack
      role="toolbar"
      aria-label={t('c3.flow.toolbar')}
      direction="row"
      spacing={1}
      useFlexGap
      sx={{ px: 1.5, py: 1, alignItems: 'center', flexWrap: 'wrap', borderBottom: 1, borderColor: 'divider' }}
    >
      {!readOnly && (
        <>
          <Button
            size="small"
            variant="contained"
            startIcon={<Add size={16} />}
            aria-haspopup="menu"
            aria-expanded={anchor ? true : undefined}
            onClick={(e) => setAnchor(e.currentTarget)}
          >
            {t('c3.flow.add')}
          </Button>
          <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
            {kinds.map((kind) => (
              <MenuItem
                key={kind.type}
                onClick={() => {
                  setAnchor(null);
                  onAdd(kind);
                }}
              >
                {kind.icon && <ListItemIcon sx={{ '& svg': { width: 18, height: 18 } }}>{kind.icon}</ListItemIcon>}
                <ListItemText>{kind.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
          <Button size="small" variant="outlined" startIcon={<Hierarchy size={16} />} onClick={onLayout}>
            {t('c3.flow.layout')}
          </Button>
        </>
      )}
      <Box sx={{ flex: 1 }} />
      {summary &&
        LIVE.filter((s) => summary[s] > 0).map((s) => (
          <StatusChip key={s} tone={STATUS_TONE[s]} label={`${summary[s]} ${t(`c3.flow.status.${s}`).toLowerCase()}`} />
        ))}
      <StatusChip tone={issueCount ? 'danger' : 'success'} label={t('c3.flow.issues', { count: issueCount })} />
    </Stack>
  );
}
