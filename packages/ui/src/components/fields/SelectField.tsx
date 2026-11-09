// material-ui
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { withHint } from './HintButton';
import type { BaseFieldProps, FieldOption, TextLikeProps } from './types';
import { optionValue } from './values';

export interface SelectFieldProps<V extends string | number> extends BaseFieldProps<V | null>, TextLikeProps {
  options: FieldOption<V>[];
  /** `<select>` do navegador: mais leve em listas longas e melhor no celular. Rótulos viram texto. */
  native?: boolean;
  /** Texto da opção vazia, que só aparece quando o campo não é obrigatório. Padrão: "—". */
  emptyLabel?: string;
}

/** Seleção de uma opção. Grava o `value` da opção, com o tipo dele (texto ou número); vazio é null. */
export default function SelectField<V extends string | number>(props: SelectFieldProps<V>) {
  const { label, value, onChange, error, helperText, hint, required, disabled, readOnly, name, fullWidth = true, sx } = props;
  const { options, native, emptyLabel = '—', size, autoFocus, onBlur } = props;
  const pick = (raw: unknown) => onChange(optionValue(options, raw));

  return (
    <TextField
      select
      label={withHint(label, hint)}
      value={value ?? ''}
      onChange={(e) => pick(e.target.value)}
      error={Boolean(error)}
      helperText={error ?? helperText}
      {...{ required, disabled, name, fullWidth, sx, size, autoFocus, onBlur }}
      slotProps={{
        select: { native, readOnly },
        inputLabel: native ? { shrink: true } : undefined
      }}
    >
      {native ? (
        <>
          {!required && <option value="">{emptyLabel}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </>
      ) : (
        [
          !required && (
            <MenuItem key="" value="">
              <em>{emptyLabel}</em>
            </MenuItem>
          ),
          ...options.map((o) => (
            <MenuItem key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </MenuItem>
          ))
        ]
      )}
    </TextField>
  );
}
