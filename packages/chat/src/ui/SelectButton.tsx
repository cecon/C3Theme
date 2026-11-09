import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

// third-party
import { ArrowDown2 } from 'iconsax-reactjs';

export interface SelectButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'value'> {
  /** O valor escolhido, em texto. */
  value: ReactNode;
  /** Texto apagado antes do valor ("Reserva"). */
  caption?: ReactNode;
  icon?: ReactNode;
  /** Algo depois do valor (contexto do modelo, etiquetas); some quando a caixa fica estreita. */
  badge?: ReactNode;
  size?: 'small' | 'medium';
  /** Nome do seletor só para leitor de tela, antes do valor ("Modelo:"). Mantém o texto visível dentro do nome. */
  srLabel?: string;
}

/** Botão dos seletores da barra da caixa de mensagem: valor em texto com a setinha (ComposerSelect, ModelPicker). */
const SelectButton = forwardRef<HTMLButtonElement, SelectButtonProps>(function SelectButton(props, ref) {
  const { value, caption, icon, badge, size = 'small', srLabel, ...rest } = props;
  return (
    <Button
      ref={ref}
      size={size}
      color="secondary"
      startIcon={icon}
      endIcon={<ArrowDown2 size={size === 'small' ? 12 : 14} />}
      sx={{
        minWidth: 0,
        px: 0.75,
        gap: 0,
        color: 'text.secondary',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        '& .MuiButton-startIcon': { mr: 0.5 }
      }}
      {...rest}
    >
      {srLabel && (
        <Box
          component="span"
          sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}
        >
          {srLabel}{' '}
        </Box>
      )}
      {caption && (
        <Box component="span" sx={{ mr: 0.5 }}>
          {caption}
        </Box>
      )}
      <Box component="span" sx={{ color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </Box>
      {badge && (
        <Box component="span" sx={{ ml: 0.75, display: 'inline-flex', '@container (max-width: 400px)': { display: 'none' } }}>
          {badge}
        </Box>
      )}
    </Button>
  );
});

export default SelectButton;
