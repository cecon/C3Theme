import { ClipboardEvent, KeyboardEvent, useRef } from 'react';

// material-ui
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import { useUiText } from '../i18n';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  /** Só dígitos (padrão) ou qualquer caractere. */
  numeric?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

/** Código de verificação em caixas separadas: avança sozinho, volta no Backspace e aceita colar o código inteiro. */
export default function OtpInput({ value, onChange, length = 6, numeric = true, error, autoFocus }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const t = useUiText();
  const chars = Array.from({ length }, (_, i) => value[i] ?? '');
  const valid = (c: string) => (numeric ? /\d/.test(c) : c.trim().length === 1);

  const focus = (i: number) => refs.current[Math.max(0, Math.min(i, length - 1))]?.focus();

  const set = (i: number, c: string) => {
    const next = [...chars];
    next[i] = c;
    onChange(next.join('').slice(0, length));
  };

  const onKeyDown = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !chars[i]) {
      e.preventDefault();
      set(i - 1, '');
      focus(i - 1);
    } else if (e.key === 'ArrowLeft') focus(i - 1);
    else if (e.key === 'ArrowRight') focus(i + 1);
  };

  const onPaste = (e: ClipboardEvent) => {
    const pasted = [...e.clipboardData.getData('text')].filter(valid).slice(0, length);
    if (!pasted.length) return;
    e.preventDefault();
    onChange(pasted.join(''));
    focus(pasted.length);
  };

  return (
    <Stack direction="row" spacing={1} onPaste={onPaste}>
      {chars.map((c, i) => (
        <InputBase
          key={i}
          inputRef={(el) => {
            refs.current[i] = el;
          }}
          value={c}
          autoFocus={autoFocus && i === 0}
          onKeyDown={onKeyDown(i)}
          onChange={(e) => {
            const typed = e.target.value.slice(-1);
            if (typed && !valid(typed)) return;
            set(i, typed);
            if (typed) focus(i + 1);
          }}
          slotProps={{
            input: {
              inputMode: numeric ? 'numeric' : 'text',
              autoComplete: i === 0 ? 'one-time-code' : 'off',
              'aria-label': t('c3.otp.digit', { index: i + 1, length }),
              maxLength: 2
            }
          }}
          sx={{
            width: 48,
            height: 52,
            border: 1,
            borderRadius: 2,
            borderColor: error ? 'error.main' : 'divider',
            bgcolor: 'background.paper',
            '&.Mui-focused': {
              borderColor: 'primary.main',
              boxShadow: (t) => `0 0 0 3px rgb(${t.vars.palette.primary.mainChannel} / 0.2)`
            },
            '& input': { textAlign: 'center', fontSize: '1.25rem', fontWeight: 600, p: 0 }
          }}
        />
      ))}
    </Stack>
  );
}
