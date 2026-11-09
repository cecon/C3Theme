// material-ui
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { TickCircle } from 'iconsax-reactjs';

import { eventToneMain, type EventTone } from '../../calendar/calendarStyles';
import { withHint } from './HintButton';
import type { BaseFieldProps } from './types';

export interface SwatchOption<V extends string | number> {
  value: V;
  /** Nome da cor: dica ao passar o mouse e o que o leitor de tela lê. */
  label: string;
  tone: EventTone;
}

export interface SwatchFieldProps<V extends string | number> extends BaseFieldProps<V | null> {
  options: SwatchOption<V>[];
}

/**
 * Escolha de cor em bolinhas (cor do evento, da etiqueta): um grupo de rádio, com o nome da cor na dica e para o
 * leitor de tela. A escolhida ganha o anel e o visto. Setas não mudam a escolha: cada bolinha é um botão no Tab.
 */
export default function SwatchField<V extends string | number>(props: SwatchFieldProps<V>) {
  const { label, hint, value, onChange, error, helperText, required, disabled, readOnly, fullWidth = true, sx, options } = props;
  const helper = error ?? helperText;
  return (
    <FormControl error={Boolean(error)} required={required} disabled={disabled} fullWidth={fullWidth} sx={sx}>
      <FormLabel component="span" sx={{ fontSize: '0.75rem', mb: 1 }}>
        {withHint(label, hint)}
      </FormLabel>
      <Box role="radiogroup" aria-label={typeof label === 'string' ? label : undefined} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Tooltip key={o.value} title={o.label}>
              <Box
                component="button"
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={o.label}
                disabled={disabled || (readOnly && !selected)}
                onClick={() => !readOnly && onChange(o.value)}
                sx={(theme) => ({
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: 2,
                  borderColor: selected ? eventToneMain(theme, o.tone) : 'transparent',
                  p: '3px',
                  bgcolor: 'transparent',
                  cursor: readOnly ? 'default' : 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  '&:disabled': { opacity: 0.4, cursor: 'default' },
                  '&:focus-visible': { outline: `2px solid ${theme.vars.palette.primary.main}`, outlineOffset: 2 }
                })}
              >
                <Box
                  sx={(theme) => ({
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    bgcolor: eventToneMain(theme, o.tone),
                    color: 'common.white',
                    display: 'grid',
                    placeItems: 'center'
                  })}
                >
                  {selected && <TickCircle size={16} variant="Bold" />}
                </Box>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
      {helper && <FormHelperText>{helper}</FormHelperText>}
    </FormControl>
  );
}
