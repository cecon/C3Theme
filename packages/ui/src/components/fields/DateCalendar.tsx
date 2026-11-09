import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useIntl } from 'react-intl';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

// third-party
import { ArrowLeft2, ArrowRight2 } from 'iconsax-reactjs';

import { useUiText } from '../../i18n';
import { addDays, fromIsoDate, inRange, monthGrid, toIsoDate } from './dateText';

export interface DateCalendarProps {
  /** Dia marcado (ISO) ou null. */
  value: string | null;
  onPick: (iso: string) => void;
  min?: string;
  max?: string;
}

const KEY_STEP: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);

/**
 * Calendário de um mês (semana a partir do domingo), com os nomes no idioma do app (não do navegador). Teclado: setas andam um dia ou
 * uma semana, PageUp/PageDown um mês, Home/End início e fim da semana, Enter escolhe.
 */
export default function DateCalendar({ value, onPick, min, max }: DateCalendarProps) {
  const { locale } = useIntl();
  const t = useUiText();
  const today = toIsoDate(new Date());
  const [cursor, setCursor] = useState(value ?? (inRange(today, min, max) ? today : (min ?? max ?? today)));
  const grid = useRef<HTMLDivElement>(null);
  const view = fromIsoDate(cursor);
  const year = view.getFullYear();
  const month = view.getMonth();

  // o foco segue o cursor (abre no dia marcado, anda com as setas)
  useEffect(() => {
    grid.current?.querySelector<HTMLElement>(`[data-day="${cursor}"]`)?.focus();
  }, [cursor]);

  const moveMonth = (n: number) => {
    const d = fromIsoDate(cursor);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
    setCursor(toIsoDate(d));
  };

  const onKey = (e: KeyboardEvent) => {
    const step = KEY_STEP[e.key];
    const weekday = fromIsoDate(cursor).getDay();
    if (step) setCursor(addDays(cursor, step));
    else if (e.key === 'PageUp' || e.key === 'PageDown') moveMonth(e.key === 'PageUp' ? -1 : 1);
    else if (e.key === 'Home') setCursor(addDays(cursor, -weekday));
    else if (e.key === 'End') setCursor(addDays(cursor, 6 - weekday));
    else if ((e.key === 'Enter' || e.key === ' ') && inRange(cursor, min, max)) onPick(cursor);
    else return;
    e.preventDefault();
  };

  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2023, 0, 1 + i));
  const title = capitalize(view.toLocaleDateString(locale, { month: 'long', year: 'numeric' }));

  return (
    <Box sx={{ p: 1.5, width: 296 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <IconButton size="small" aria-label={t('c3.date.prev')} onClick={() => moveMonth(-1)}>
          <ArrowLeft2 size={18} />
        </IconButton>
        <Typography variant="subtitle1" aria-live="polite">
          {title}
        </Typography>
        <IconButton size="small" aria-label={t('c3.date.next')} onClick={() => moveMonth(1)}>
          <ArrowRight2 size={18} />
        </IconButton>
      </Stack>
      <Box role="grid" aria-label={title} ref={grid} onKeyDown={onKey}>
        <Box role="row" sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {weekdays.map((d) => (
            <Typography
              key={d.getDay()}
              role="columnheader"
              aria-label={d.toLocaleDateString(locale, { weekday: 'long' })}
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: 'center', py: 0.5 }}
            >
              {d.toLocaleDateString(locale, { weekday: 'narrow' })}
            </Typography>
          ))}
        </Box>
        {monthGrid(year, month).map((week, w) => (
          <Box key={w} role="row" sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {week.map((iso, i) =>
              iso ? (
                <Day
                  key={iso}
                  iso={iso}
                  label={fromIsoDate(iso).toLocaleDateString(locale, { dateStyle: 'full' })}
                  selected={iso === value}
                  today={iso === today}
                  focusable={iso === cursor}
                  disabled={!inRange(iso, min, max)}
                  onPick={() => {
                    setCursor(iso);
                    onPick(iso);
                  }}
                />
              ) : (
                <Box key={`v${i}`} role="gridcell" />
              )
            )}
          </Box>
        ))}
      </Box>
      <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 1 }}>
        <Button size="small" onClick={() => onPick(today)} disabled={!inRange(today, min, max)}>
          {t('c3.date.today')}
        </Button>
      </Stack>
    </Box>
  );
}

interface DayProps {
  iso: string;
  label: string;
  selected: boolean;
  today: boolean;
  focusable: boolean;
  disabled: boolean;
  onPick: () => void;
}

function Day({ iso, label, selected, today, focusable, disabled, onPick }: DayProps) {
  return (
    <Box role="gridcell" aria-selected={selected} sx={{ display: 'flex', justifyContent: 'center', py: 0.25 }}>
      <ButtonBase
        data-day={iso}
        aria-label={label}
        aria-current={today ? 'date' : undefined}
        tabIndex={focusable ? 0 : -1}
        disabled={disabled}
        onClick={onPick}
        sx={(theme) => ({
          width: 36,
          height: 36,
          borderRadius: '50%',
          typography: 'body2',
          border: '1px solid',
          borderColor: today && !selected ? 'primary.main' : 'transparent',
          bgcolor: selected ? 'primary.main' : 'transparent',
          color: selected ? 'primary.contrastText' : disabled ? 'text.disabled' : 'text.primary',
          '&:hover': { bgcolor: selected ? 'primary.dark' : alpha(theme.palette.primary.main, 0.08) },
          '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 1 }
        })}
      >
        {Number(iso.slice(8, 10))}
      </ButtonBase>
    </Box>
  );
}
