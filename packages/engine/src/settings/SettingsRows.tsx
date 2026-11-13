import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import type { useEngine } from '../context';
import type { SettingsRowDef } from '../settingsTypes';
import type { Text } from '../types';
import type { SettingsValue } from './port';
import SettingsRowControl from './SettingsRowControl';
export default function StackDeRows({
  rows,
  valor,
  text,
  components,
  gravar,
  executar,
  abrirPagina,
  highlight
}: {
  rows: readonly SettingsRowDef[];
  valor: Record<string, SettingsValue>;
  text: (value: Text | undefined, fallback?: string) => string;
  components: ReturnType<typeof useEngine>['components'];
  gravar: (row: SettingsRowDef, novo: string | number | boolean) => Promise<void>;
  executar: (row: SettingsRowDef, action: string) => Promise<void>;
  abrirPagina: (id: string) => void;
  highlight?: string;
}) {
  return (
    <Stack sx={{ gap: 0 }}>
      {rows.map((row) => (
        <Box
          key={row.id}
          data-settings-row={row.id}
          data-highlighted={highlight === row.id || undefined}
          sx={{
            borderRadius: 1,
            ...(highlight === row.id && { bgcolor: 'action.selected', outline: '2px solid', outlineColor: 'primary.main' })
          }}
        >
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
