// material-ui
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import type { IdleAction } from './MainButton';

/** A ação de voz como botão fixo na barra de baixo (variante split), sem fundo, do tamanho do +. */
export default function IdleButton({ action, disabled }: { action: IdleAction; disabled?: boolean }) {
  return (
    <Tooltip title={action.label}>
      <span>
        <IconButton
          aria-label={action.label}
          onClick={action.onClick}
          disabled={disabled}
          sx={{ width: 28, height: 28, borderRadius: '50%' }}
        >
          {action.icon}
        </IconButton>
      </span>
    </Tooltip>
  );
}
