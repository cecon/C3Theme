import type { FormEvent, ReactNode } from 'react';
import { useIntl } from 'react-intl';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Printer, SearchNormal1 } from 'iconsax-reactjs';

import { useUiText } from '../../i18n';
import DateField from '../fields/DateField';
import { printHidden, printOnly } from './print';
import { activeShortcut, PERIOD_SHORTCUTS, periodProblem, shortcutPeriod } from './period';
import type { Period, PeriodShortcut } from './period';

export interface PeriodFilterProps {
  value: Period;
  onChange: (value: Period) => void;
  /** Aplica o período; só é chamado com o período válido. */
  onFilter: (value: Period) => void;
  /** Mostra o botão Imprimir; o padrão é `window.print()`. Passe `false` para escondê-lo. */
  onPrint?: (() => void) | false;
  /** Fichas de atalho; `true` mostra todas. Um atalho preenche e filtra no mesmo clique. */
  shortcuts?: boolean | PeriodShortcut[];
  /** As duas datas obrigatórias (consulta que não pode varrer tudo). */
  required?: boolean;
  /** Filtros extras da tela, na mesma linha (filial, situação). */
  children?: ReactNode;
  loading?: boolean;
}

/**
 * Barra de consulta por período: de/até, Filtrar e Imprimir, com atalhos opcionais. No papel a barra some e fica
 * uma linha "Período: … a …", para o relatório impresso dizer o que mostra.
 */
export default function PeriodFilter(props: PeriodFilterProps) {
  const { value, onChange, onFilter, onPrint, shortcuts, required, children, loading } = props;
  const t = useUiText();
  const { locale } = useIntl();
  const problem = periodProblem(value, required);
  const list = shortcuts === true ? PERIOD_SHORTCUTS : shortcuts || [];
  const active = activeShortcut(value);
  const print = onPrint === false ? undefined : (onPrint ?? (() => window.print()));
  const show = (d: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString(locale) : '…');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!problem) onFilter(value);
  };

  return (
    <>
      <Box component="form" onSubmit={submit} sx={printHidden}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'flex-start' } }}>
          <DateField
            label={t('c3.period.from')}
            value={value.from}
            onChange={(from) => onChange({ ...value, from })}
            max={value.to ?? undefined}
            required={required}
            error={problem === 'order' ? t('c3.period.order') : undefined}
            fullWidth={false}
            sx={{ minWidth: { sm: 170 } }}
          />
          <DateField
            label={t('c3.period.to')}
            value={value.to}
            onChange={(to) => onChange({ ...value, to })}
            min={value.from ?? undefined}
            required={required}
            fullWidth={false}
            sx={{ minWidth: { sm: 170 } }}
          />
          {children}
          <Stack direction="row" spacing={1} sx={{ pt: { sm: 0.75 } }}>
            <Button type="submit" variant="contained" startIcon={<SearchNormal1 size={18} />} disabled={Boolean(problem) || loading}>
              {t('c3.period.filter')}
            </Button>
            {print && (
              <Button variant="outlined" startIcon={<Printer size={18} />} onClick={print}>
                {t('c3.period.print')}
              </Button>
            )}
          </Stack>
        </Stack>
        {list.length > 0 && (
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
            {list.map((s) => (
              <Chip
                key={s}
                label={t(`c3.period.${s}`)}
                size="small"
                color={active === s ? 'primary' : 'default'}
                variant={active === s ? 'filled' : 'outlined'}
                aria-pressed={active === s}
                onClick={() => {
                  const p = shortcutPeriod(s);
                  onChange(p);
                  onFilter(p);
                }}
              />
            ))}
          </Stack>
        )}
      </Box>
      <Typography variant="body2" sx={printOnly}>
        {t('c3.period.printed', { from: show(value.from), to: show(value.to) })}
      </Typography>
    </>
  );
}
