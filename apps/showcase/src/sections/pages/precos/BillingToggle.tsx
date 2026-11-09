// material-ui
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { StatusChip } from '@c3theme/ui';
import { ANNUAL_DISCOUNT, Billing } from './planos';

/** Alternância entre cobrança mensal e anual. */
export default function BillingToggle({ value, onChange }: { value: Billing; onChange: (b: Billing) => void }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
      <ToggleButtonGroup
        exclusive
        value={value}
        onChange={(_, v: Billing | null) => v && onChange(v)}
        aria-label="Ciclo de cobrança"
        size="small"
      >
        <ToggleButton value="mensal" sx={{ px: 2.5 }}>
          Mensal
        </ToggleButton>
        <ToggleButton value="anual" sx={{ px: 2.5 }}>
          Anual
        </ToggleButton>
      </ToggleButtonGroup>
      <StatusChip label={`Economize ${ANNUAL_DISCOUNT * 100}% no anual`} tone="success" />
    </Stack>
  );
}
