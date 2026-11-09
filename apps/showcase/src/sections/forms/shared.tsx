import { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import { useColorScheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

// third-party
import { PatternFormat } from 'react-number-format';

interface HorizontalFieldProps {
  label: string;
  htmlFor?: string;
  /** Largura da coluna do rótulo em telas médias (de 12). */
  labelSize?: number;
  children: ReactNode;
}

/** Linha de formulário horizontal: rótulo à esquerda (no celular, em cima) e campo à direita. */
export function HorizontalField({ label, htmlFor, labelSize = 3, children }: HorizontalFieldProps) {
  return (
    <Grid container spacing={{ xs: 1, md: 2 }} sx={{ alignItems: { md: 'center' } }}>
      <Grid size={{ xs: 12, md: labelSize }}>
        <Typography component="label" htmlFor={htmlFor} variant="subtitle2" sx={{ display: 'block', textAlign: { md: 'end' } }}>
          {label}
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 12 - labelSize }}>{children}</Grid>
    </Grid>
  );
}

/** Título de um grupo de campos dentro do mesmo formulário. */
export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1">{children}</Typography>
      {hint && (
        <Typography variant="body2" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Box>
  );
}

type MaskedFieldProps = Omit<TextFieldProps, 'value' | 'onChange' | 'defaultValue' | 'type'> & {
  /** Máscara do react-number-format: `#` é um dígito (ex.: `###.###.###-##`). */
  format: string;
  value: string;
  /** Recebe o valor já formatado, como aparece na tela. */
  onValueChange: (formatted: string) => void;
};

/** Campo de texto com máscara fixa (CPF, CEP, cartão...). */
export function MaskedField({ format, value, onValueChange, ...props }: MaskedFieldProps) {
  return (
    <PatternFormat
      {...props}
      customInput={TextField}
      format={format}
      mask="_"
      value={value}
      onValueChange={(v) => onValueChange(v.value ? v.formattedValue : '')}
      slotProps={{ htmlInput: { inputMode: 'numeric' }, ...props.slotProps }}
    />
  );
}

/** Modo de cor efetivo (resolve a opção "sistema"). */
export function useIsDark() {
  const { mode, systemMode } = useColorScheme();
  return (mode === 'system' ? systemMode : mode) === 'dark';
}
