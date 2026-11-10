import type { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { ArrowUp } from 'iconsax-reactjs';

/** A ação do botão principal com a caixa vazia e o assistente parado (por exemplo, a conversa por voz). */
export interface IdleAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

interface Props {
  mode: 'send' | 'stop' | 'idle';
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  idle?: IdleAction;
  /** `square`: o quadrado de 36 px na cor primária; `circle`: o círculo cheio de 28 px em contraste (variante inline). */
  shape: 'square' | 'circle';
}

/** Enviar, parar ou a ação de espera, sempre no mesmo lugar e do mesmo tamanho. */
export default function MainButton({ mode, label, onClick, disabled, idle, shape }: Props) {
  const circle = shape === 'circle';
  const size = circle ? 28 : 36;
  const icon =
    mode === 'stop' ? (
      <Box aria-hidden sx={{ width: circle ? 10 : 12, height: circle ? 10 : 12, borderRadius: 0.5, bgcolor: 'currentColor' }} />
    ) : mode === 'idle' && idle ? (
      idle.icon
    ) : (
      <ArrowUp size={circle ? 16 : 18} />
    );
  const name = mode === 'idle' && idle ? idle.label : label;
  return (
    <Tooltip title={name}>
      <span>
        <IconButton
          aria-label={name}
          onClick={mode === 'idle' && idle ? idle.onClick : onClick}
          disabled={disabled}
          sx={{
            width: size,
            height: size,
            flexShrink: 0,
            ...(circle
              ? {
                  borderRadius: '50%',
                  bgcolor: 'text.primary',
                  color: 'background.paper',
                  '&:hover': { bgcolor: 'text.secondary' },
                  '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' }
                }
              : {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' }
                })
          }}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );
}
