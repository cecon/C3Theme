// Linhas do modal de configurações: cada uma vira o SettingsRow do @c3theme/ui com o controle da spec (#119).

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { useEngine } from '../context';
import type { Text } from '../types';
import type { SettingsValue } from './port';
import SettingsRowControl from './SettingsRowControl';
import type { SettingsRowDef } from '../settingsTypes';

export default function StackDeRows({
  rows,
  valor,
  text,
  components,
  gravar,
  executar,
  abrirPagina
}: {
  rows: readonly SettingsRowDef[];
  valor: Record<string, SettingsValue>;
  text: (value: Text | undefined, fallback?: string) => string;
  components: ReturnType<typeof useEngine>['components'];
  gravar: (row: SettingsRowDef, novo: string | number | boolean) => Promise<void>;
  executar: (row: SettingsRowDef, action: string) => Promise<void>;
  abrirPagina: (id: string) => void;
}) {
  return (
    <Stack sx={{ gap: 0 }}>
      {rows.map((row) => (
        <Box key={row.id} data-settings-row={row.id}>
          <SettingsRowControl
            def={row}
            binding={{
              text,
              value: valor[row.id],
              onChange: (novo) => void gravar(row, novo),
              onAction: (action) => void executar(row, action),
              openPage: abrirPagina,
              component: row.control.type === 'custom' ? components[row.control.component] : undefined
            }}
          />
        </Box>
      ))}
    </Stack>
  );
}
