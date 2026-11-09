import { useState } from 'react';

// material-ui
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { useUiText } from '../../i18n';
import DateField from './DateField';
import { maskTime, parseTimeText } from './dateText';
import type { BaseFieldProps, TextLikeProps } from './types';

export interface DateTimeFieldProps extends BaseFieldProps<string | null>, TextLikeProps {
  /** Limites do dia em ISO (AAAA-MM-DD). */
  min?: string;
  max?: string;
}

const split = (v: string | null) => ({ date: v ? v.slice(0, 10) : null, time: v ? v.slice(11, 16) : '' });

/**
 * Data e hora no fuso de quem usa. O valor é `AAAA-MM-DDTHH:MM` (como o `datetime-local`) ou null; quem grava em
 * UTC converte. A data segue o idioma do app (ver DateField) e a hora é sempre 24 h ("14:30"), com os dois-pontos
 * postos sozinhos. O valor só existe com as duas partes completas; ao sair da hora vazia ou pela metade, avisa.
 */
export default function DateTimeField(props: DateTimeFieldProps) {
  const { label, value, onChange, error, helperText, hint, required, disabled, readOnly, name, fullWidth = true, sx } = props;
  const { min, max, placeholder, size, autoFocus, onBlur } = props;
  const t = useUiText();
  const [date, setDate] = useState(() => split(value).date);
  const [time, setTime] = useState(() => split(value).time);
  const [typed, setTyped] = useState(value);
  const [problem, setProblem] = useState<string | undefined>();

  // valor trocado por fora (outro registro): as duas partes acompanham
  if (value !== typed) {
    setTyped(value);
    setDate(split(value).date);
    setTime(split(value).time);
    setProblem(undefined);
  }

  const emit = (d: string | null, tm: string) => {
    const hour = parseTimeText(tm);
    const next = d && hour && hour !== 'invalid' ? `${d}T${hour}` : null;
    setTyped(next);
    if (next !== value) onChange(next);
  };

  const leaveTime = () => {
    const hour = parseTimeText(time);
    if (hour === 'invalid' || (date && !hour)) setProblem(t('c3.date.timeInvalid'));
    onBlur?.();
  };

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={[{ width: fullWidth ? '100%' : undefined, alignItems: 'flex-start' }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <DateField
        label={label}
        hint={hint}
        value={date}
        onChange={(d) => {
          setDate(d);
          emit(d, time);
        }}
        error={error}
        helperText={helperText}
        sx={{ flex: 1, minWidth: 0 }}
        {...{ required, disabled, readOnly, name, min, max, placeholder, size, autoFocus }}
      />
      <TextField
        label={t('c3.date.time')}
        value={time}
        onChange={(e) => {
          const next = maskTime(e.target.value, time);
          setTime(next);
          setProblem(undefined);
          emit(date, next);
        }}
        onBlur={leaveTime}
        error={Boolean(problem)}
        helperText={problem}
        placeholder="00:00"
        {...{ required, disabled, size }}
        sx={{ width: 92, flexShrink: 0 }}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { readOnly, inputMode: 'numeric', autoComplete: 'off', maxLength: 5 } }}
      />
    </Stack>
  );
}
