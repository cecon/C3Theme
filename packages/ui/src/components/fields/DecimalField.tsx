import { useState } from 'react';
import type { ReactNode } from 'react';
import { useIntl } from 'react-intl';

// material-ui
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import { withHint } from './HintButton';
import type { BaseFieldProps, TextLikeProps } from './types';
import { decimalSep, formatDecimal, parseDecimal } from './values';

export interface DecimalFieldProps extends BaseFieldProps<string | null>, TextLikeProps {
  /** Casas decimais: corta a digitação além delas e completa com zeros ao sair do campo. Sem ela, livre. */
  scale?: number;
  /** Antes do número ("R$"). */
  prefix?: ReactNode;
  /** Depois do número ("kg", "L", "%"). */
  suffix?: ReactNode;
  allowNegative?: boolean;
}

/**
 * Número com escala (quantidade, peso, percentual). O valor é string com ponto ("1234.5"), como a spec trafega:
 * nunca float. Digita com vírgula ou ponto; fora do foco mostra com milhar e a escala completa.
 */
export default function DecimalField(props: DecimalFieldProps) {
  const { label, value, onChange, error, helperText, hint, required, disabled, readOnly, name, fullWidth = true, sx } = props;
  const { scale, prefix, suffix, allowNegative = true, placeholder, size, autoFocus, onBlur } = props;
  const { locale } = useIntl();
  const [focused, setFocused] = useState(false);
  const v = value ?? '';
  const shown =
    focused || v === '' || v === '-'
      ? v.replace('.', decimalSep(locale))
      : formatDecimal(v, scale ?? (v.split('.')[1] ?? '').length, locale);

  return (
    <TextField
      label={withHint(label, hint)}
      value={shown}
      onChange={(e) => {
        const next = parseDecimal(e.target.value, scale, allowNegative);
        if (next !== undefined) onChange(next);
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      error={Boolean(error)}
      helperText={error ?? helperText}
      {...{ required, disabled, name, fullWidth, sx, placeholder, size, autoFocus }}
      slotProps={{
        htmlInput: { inputMode: 'decimal', readOnly },
        input: {
          startAdornment: prefix ? <InputAdornment position="start">{prefix}</InputAdornment> : undefined,
          endAdornment: suffix ? <InputAdornment position="end">{suffix}</InputAdornment> : undefined
        }
      }}
    />
  );
}
