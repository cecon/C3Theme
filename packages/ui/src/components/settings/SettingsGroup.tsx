import { ReactNode, useId, useMemo } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { SettingsGroupContext } from './context';

export interface SettingsGroupProps {
  /** título do grupo, por exemplo "Doca de agentes" */
  title?: string;
  /** texto curto abaixo do cartão (nota de rodapé do grupo) */
  footnote?: ReactNode;
  /** desliga as linhas marcadas `dependent` (elas continuam visíveis); em geral é `!switchPrincipal` */
  dependentsDisabled?: boolean;
  /** linhas do grupo (SettingsRow, SettingsChecklist); a divisória entre elas é automática */
  children: ReactNode;
}

/** Grupo de ajustes: título, cartão com as linhas separadas por divisória e nota opcional embaixo. */
export default function SettingsGroup({ title, footnote, dependentsDisabled = false, children }: SettingsGroupProps) {
  const titleId = useId();
  const value = useMemo(() => ({ dependentsDisabled }), [dependentsDisabled]);
  return (
    <SettingsGroupContext.Provider value={value}>
      <Box component="section" aria-labelledby={title ? titleId : undefined}>
        {title && (
          <Typography id={titleId} component="h3" variant="subtitle2" sx={{ px: 0.5, mb: 0.75, fontWeight: 600 }}>
            {title}
          </Typography>
        )}
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          <Stack divider={<Divider flexItem />}>{children}</Stack>
        </Paper>
        {footnote && (
          <Typography variant="caption" component="p" color="text.secondary" sx={{ px: 0.5, mt: 0.75 }}>
            {footnote}
          </Typography>
        )}
      </Box>
    </SettingsGroupContext.Provider>
  );
}
