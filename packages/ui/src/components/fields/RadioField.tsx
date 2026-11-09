// material-ui
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';

import { withHint } from './HintButton';
import type { BaseFieldProps, FieldOption } from './types';

export interface RadioFieldProps<V extends string | number> extends BaseFieldProps<V | null> {
  options: FieldOption<V>[];
  /** Opções lado a lado (padrão) ou uma por linha. */
  row?: boolean;
}

/** Escolha de uma entre poucas opções, todas à vista. Grava o `value` da opção, com o tipo dele. */
export default function RadioField<V extends string | number>(props: RadioFieldProps<V>) {
  const { label, hint, value, onChange, error, helperText, required, disabled, readOnly, name, fullWidth = true, sx } = props;
  const { options, row = true } = props;
  const helper = error ?? helperText;

  return (
    <FormControl error={Boolean(error)} required={required} disabled={disabled} fullWidth={fullWidth} sx={sx} component="fieldset">
      <FormLabel component="legend" sx={{ fontSize: '0.75rem' }}>
        {withHint(label, hint)}
      </FormLabel>
      <RadioGroup
        row={row}
        name={name}
        value={value === null ? '' : String(value)}
        onChange={(e) => {
          if (readOnly) return;
          onChange(options.find((o) => String(o.value) === e.target.value)?.value ?? null);
        }}
      >
        {options.map((o) => (
          <FormControlLabel
            key={o.value}
            value={String(o.value)}
            control={<Radio />}
            label={o.label}
            disabled={o.disabled || (readOnly && o.value !== value)}
          />
        ))}
      </RadioGroup>
      {helper && <FormHelperText>{helper}</FormHelperText>}
    </FormControl>
  );
}
