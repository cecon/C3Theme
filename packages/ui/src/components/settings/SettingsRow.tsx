import { ReactNode, useContext, useId, useMemo } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { DISABLED_OPACITY, SettingsGroupContext, SettingsRowContext } from './context';

export interface SettingsRowProps {
  /** rótulo em negrito */
  label: ReactNode;
  /** explicação curta embaixo do rótulo */
  description?: ReactNode;
  /** depende do switch principal do grupo: fica desabilitada quando o grupo tem `dependentsDisabled` */
  dependent?: boolean;
  disabled?: boolean;
  /** o controle à direita: SettingsSwitch, SettingsSelect, SettingsSlider, SettingsAction ou um próprio (useSettingsRow) */
  children?: ReactNode;
}

/** Linha de ajuste: rótulo e explicação à esquerda, controle à direita. Os ids ligam o texto ao controle. */
export default function SettingsRow({ label, description, dependent = false, disabled = false, children }: SettingsRowProps) {
  const { dependentsDisabled } = useContext(SettingsGroupContext);
  const off = disabled || (dependent && dependentsDisabled);
  const labelId = useId();
  const descId = useId();
  const descriptionId = description ? descId : undefined;
  const row = useMemo(() => ({ labelId, descriptionId, disabled: off }), [labelId, descriptionId, off]);
  return (
    <SettingsRowContext.Provider value={row}>
      <Box
        aria-disabled={off || undefined}
        sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 2, rowGap: 1, px: 2, py: 1.25, minHeight: 48 }}
      >
        <Box sx={{ flex: '1 1 220px', minWidth: 0, opacity: off ? DISABLED_OPACITY : 1 }}>
          <Typography id={labelId} variant="body2" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          {description && (
            <Typography id={descId} variant="caption" component="p" color="text.secondary" sx={{ mt: 0.25 }}>
              {description}
            </Typography>
          )}
        </Box>
        {children && <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', ml: 'auto' }}>{children}</Box>}
      </Box>
    </SettingsRowContext.Provider>
  );
}
