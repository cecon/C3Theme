import type { ReactNode } from 'react';

// material-ui
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

/**
 * Botão redondo de 28 px com fundo sutil, para as ações ao lado do texto na variante inline do `AgentComposer`
 * (`endActions`): nova conversa, microfone. O ícone vai como filho.
 */
export default function ComposerIconButton(props: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <Tooltip title={props.label}>
      <span>
        <IconButton
          aria-label={props.label}
          onClick={props.onClick}
          disabled={props.disabled}
          sx={{ bgcolor: 'action.hover', width: 28, height: 28, flexShrink: 0, borderRadius: '50%' }}
        >
          {props.children}
        </IconButton>
      </span>
    </Tooltip>
  );
}
