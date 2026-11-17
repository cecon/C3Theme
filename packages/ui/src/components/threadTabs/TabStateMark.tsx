import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { MessageQuestion, Warning2 } from 'iconsax-reactjs';

import type { ThreadTabState } from './types';

/** Marca do estado da aba: forma diferente para cada um (não depende só da cor); o texto vai no nome da aba. */
export default function TabStateMark({ state }: { state: ThreadTabState }) {
  const mark = {
    running: <CircularProgress size={10} thickness={6} color="inherit" />,
    waiting: <MessageQuestion size={14} />,
    unread: <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />,
    failed: <Warning2 size={14} />
  }[state];
  return (
    <Box
      component="span"
      aria-hidden="true"
      data-state={state}
      sx={{ display: 'inline-flex', alignItems: 'center', color: state === 'failed' ? 'error.main' : 'text.secondary' }}
    >
      {mark}
    </Box>
  );
}
