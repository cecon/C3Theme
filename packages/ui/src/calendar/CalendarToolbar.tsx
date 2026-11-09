// material-ui
import type { ReactNode } from 'react';

import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { Add, ArrowLeft2, ArrowRight2, Calendar1, CalendarTick, Category, RowVertical, TextalignJustifycenter } from 'iconsax-reactjs';

export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

const VIEWS: { value: CalendarView; label: string; icon: typeof Category }[] = [
  { value: 'dayGridMonth', label: 'Mês', icon: Category },
  { value: 'timeGridWeek', label: 'Semana', icon: RowVertical },
  { value: 'timeGridDay', label: 'Dia', icon: Calendar1 },
  { value: 'listWeek', label: 'Agenda', icon: TextalignJustifycenter }
];

interface CalendarToolbarProps {
  title: string;
  view: CalendarView;
  compact: boolean;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onView: (view: CalendarView) => void;
  /** Sem ele, o botão de criar some (quem não pode criar). */
  onAdd?: () => void;
  /** Texto do botão de criar (padrão "Novo evento"). */
  addLabel?: string;
  /** Antes das visões (ex.: a troca para a lista no motor). */
  extra?: ReactNode;
}

/** Navegação do calendário: hoje, anterior/próximo, período visível e troca de visão. */
export default function CalendarToolbar({
  title,
  view,
  compact,
  onToday,
  onPrev,
  onNext,
  onView,
  onAdd,
  addLabel = 'Novo evento',
  extra
}: CalendarToolbarProps) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={1.5}
      sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', px: { xs: 2, sm: 2.5 }, py: 2 }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
        <Button variant="outlined" color="secondary" size="small" startIcon={<CalendarTick size={16} />} onClick={onToday}>
          Hoje
        </Button>
        <Stack direction="row" sx={(theme) => ({ '& svg': { transform: theme.direction === 'rtl' ? 'scaleX(-1)' : 'none' } })}>
          <Tooltip title="Anterior">
            <IconButton aria-label="Período anterior" onClick={onPrev} size="small">
              <ArrowLeft2 size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Próximo">
            <IconButton aria-label="Próximo período" onClick={onNext} size="small">
              <ArrowRight2 size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
        <Typography variant="h5" component="h2" sx={{ minWidth: 0, fontSize: { xs: '1rem', sm: undefined } }}>
          {title}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        {extra}
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(_, v: CalendarView | null) => v && onView(v)}
          aria-label="Visão do calendário"
        >
          {VIEWS.map(({ value, label, icon: Icon }) =>
            compact ? (
              <ToggleButton key={value} value={value} aria-label={label} sx={{ px: 1.25 }}>
                <Icon size={18} />
              </ToggleButton>
            ) : (
              <ToggleButton key={value} value={value} sx={{ px: 1.75, textTransform: 'none' }}>
                {label}
              </ToggleButton>
            )
          )}
        </ToggleButtonGroup>
        {onAdd && (
          <Button variant="contained" size="small" startIcon={<Add size={18} />} onClick={onAdd} sx={{ flexShrink: 0 }}>
            {addLabel}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
