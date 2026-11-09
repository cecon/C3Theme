import { useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

// material-ui
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import TextField from '@mui/material/TextField';

// third-party
import { Calendar1 } from 'iconsax-reactjs';

import { useUiText } from '../../i18n';
import DateCalendar from './DateCalendar';
import { datePattern, datePlaceholder, formatIsoDate, inRange, maskDate, parseDateText } from './dateText';
import { withHint } from './HintButton';
import type { BaseFieldProps, TextLikeProps } from './types';

export interface DateFieldProps extends BaseFieldProps<string | null>, TextLikeProps {
  /** Limites em ISO (AAAA-MM-DD). */
  min?: string;
  max?: string;
}

/**
 * Data sem hora. O valor é ISO (AAAA-MM-DD) ou null. A tela segue o idioma do app (dd/mm/aaaa em pt-BR), não o do
 * navegador: digita só os números, com a barra posta sozinha, ou escolhe no calendário. Enquanto a data está
 * incompleta o valor é null, como no campo nativo; ao sair do campo, o texto incompleto vira aviso.
 */
export default function DateField(props: DateFieldProps) {
  const { label, value, onChange, error, helperText, hint, required, disabled, readOnly, name, fullWidth = true, sx } = props;
  const { min, max, placeholder, size, autoFocus, onBlur } = props;
  const { locale } = useIntl();
  const t = useUiText();
  const pattern = useMemo(() => datePattern(locale), [locale]);
  const [text, setText] = useState(() => formatIsoDate(value, pattern));
  const [typed, setTyped] = useState<string | null | undefined>(value);
  const [problem, setProblem] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
  const input = useRef<HTMLInputElement>(null);

  // valor trocado por fora (outro registro, atalho de período): o texto acompanha
  if (value !== typed) {
    setTyped(value);
    setText(formatIsoDate(value, pattern));
    setProblem(undefined);
  }

  const emit = (next: string | null) => {
    setTyped(next);
    if (next !== value) onChange(next);
  };

  const type = (raw: string) => {
    const masked = maskDate(raw, pattern, text);
    setText(masked);
    setProblem(undefined);
    const parsed = parseDateText(masked, pattern);
    emit(parsed === 'invalid' ? null : parsed);
  };

  const pick = (iso: string) => {
    setText(formatIsoDate(iso, pattern));
    setProblem(undefined);
    emit(iso);
    close();
  };

  // fecha e devolve o foco ao texto (Esc ou escolha), como um menu
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) input.current?.focus();
  };

  const leave = () => {
    const parsed = parseDateText(text, pattern);
    // o foco foi para o calendário: ainda não saiu do campo
    if (open) return;
    if (parsed === 'invalid') setProblem(t('c3.date.invalid'));
    else if (parsed && !inRange(parsed, min, max)) setProblem(t('c3.date.range'));
    onBlur?.();
  };

  const locked = disabled || readOnly;
  const shownError = error ?? problem;

  return (
    <>
      <TextField
        ref={setAnchor}
        inputRef={input}
        label={withHint(label, hint)}
        value={text}
        onChange={(e) => type(e.target.value)}
        onBlur={leave}
        error={Boolean(shownError)}
        helperText={shownError ?? helperText}
        placeholder={placeholder ?? datePlaceholder(pattern, t('c3.date.letters'))}
        {...{ required, disabled, name, fullWidth, sx, size, autoFocus }}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: { readOnly, inputMode: 'numeric', autoComplete: 'off', maxLength: 10 },
          input: {
            endAdornment: locked ? undefined : (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  size="small"
                  aria-label={t('c3.date.open')}
                  // o clique no ícone não tira o foco do texto (senão a data pela metade vira aviso antes de escolher)
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setOpen(true)}
                >
                  <Calendar1 size={18} />
                </IconButton>
              </InputAdornment>
            )
          }
        }}
      />
      {/* Popper, não Popover: vira para cima quando falta espaço embaixo, sem cobrir o próprio campo */}
      <Popper
        open={open}
        anchorEl={anchor}
        placement="bottom-start"
        modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
        sx={{ zIndex: 'modal' }}
      >
        <ClickAwayListener onClickAway={() => close(false)}>
          <Paper elevation={8} onKeyDown={(e) => e.key === 'Escape' && close()}>
            <DateCalendar value={typed ?? null} onPick={pick} min={min} max={max} />
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
}
