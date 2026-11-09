import type { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import type { LookupButton } from '../hooks/useLookups';

/** Campo com o botão de consulta ao lado (`lookups` com trigger 'button'); sem botão, só o campo. */
export default function WithLookup({ button, children }: { button?: LookupButton; children: ReactNode }) {
  if (!button) return <>{children}</>;
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      <Button
        variant="outlined"
        onClick={button.run}
        disabled={button.disabled}
        loading={button.busy}
        sx={{ flexShrink: 0, minHeight: 54 }}
      >
        {button.label}
      </Button>
    </Stack>
  );
}
