// material-ui
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Stack from '@mui/material/Stack';

import { useUiText } from '../../i18n';
import { withHint } from './HintButton';
import type { BaseFieldProps, FieldOption } from './types';
import { allFlags } from './values';

export interface FlagsFieldProps extends BaseFieldProps<number> {
  /** Uma opção por bit (1, 2, 4, …). */
  options: FieldOption<number>[];
}

/**
 * Várias marcações num número (dias da semana, canais): uma ficha por opção, marcada ou não. O valor é a soma dos
 * bits marcados; nenhum marcado é 0. Os atalhos "Todos" e "Limpar" poupam sete cliques.
 */
export default function FlagsField(props: FlagsFieldProps) {
  const { label, hint, value, onChange, error, helperText, required, disabled, readOnly, fullWidth = true, sx, options } = props;
  const t = useUiText();
  const mask = value ?? 0;
  const all = allFlags(options);
  const locked = readOnly || disabled;
  const helper = error ?? helperText;

  return (
    <FormControl error={Boolean(error)} required={required} disabled={disabled} fullWidth={fullWidth} sx={sx} component="fieldset">
      <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.75rem' }}>
        {withHint(label, hint)}
      </FormLabel>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
        {options.map((o) => {
          const on = (mask & o.value) !== 0;
          return (
            <Chip
              key={o.value}
              label={o.label}
              color={on ? 'primary' : 'default'}
              variant={on ? 'filled' : 'outlined'}
              aria-pressed={on}
              onClick={locked || o.disabled ? undefined : () => onChange(mask ^ o.value)}
              disabled={(locked && !on) || o.disabled}
            />
          );
        })}
        {!locked && (
          <Chip
            label={mask === all ? t('c3.flags.clear') : t('c3.flags.all')}
            variant="outlined"
            onClick={() => onChange(mask === all ? 0 : all)}
            sx={{ borderStyle: 'dashed' }}
          />
        )}
      </Stack>
      {helper && <FormHelperText>{helper}</FormHelperText>}
    </FormControl>
  );
}
