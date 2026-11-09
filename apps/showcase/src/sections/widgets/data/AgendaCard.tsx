import { FormEvent, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { PickerDay, PickerDayProps } from '@mui/x-date-pickers/PickerDay';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Add } from 'iconsax-reactjs';

import { Dot, notify, Panel } from '@c3theme/ui';
import { AGENDA } from '../data';

type AgendaEvent = (typeof AGENDA)[number];

// data de referência fixa, para a vitrine mostrar sempre os mesmos compromissos
const TODAY = parseISO('2026-10-18');
const key = (d: Date) => format(d, 'yyyy-MM-dd');

/** Dia do calendário com um pontinho quando há compromisso. */
function EventDay(props: PickerDayProps & { marked?: Set<string> }) {
  const { marked, ...rest } = props;
  const has = !rest.outsideCurrentMonth && marked?.has(key(rest.day));
  return (
    <PickerDay
      {...rest}
      sx={
        has
          ? {
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 4,
                width: 4,
                height: 4,
                borderRadius: '50%',
                bgcolor: rest.selected ? 'primary.contrastText' : 'primary.main'
              }
            }
          : undefined
      }
    />
  );
}

/** Calendário pequeno com os compromissos do dia escolhido e inclusão rápida. */
export default function AgendaCard() {
  const [events, setEvents] = useState<AgendaEvent[]>(AGENDA);
  const [day, setDay] = useState<Date>(TODAY);
  const [time, setTime] = useState('09:00');
  const [title, setTitle] = useState('');
  const marked = new Set(events.map((e) => e.date));
  const ofDay = events.filter((e) => e.date === key(day)).sort((a, b) => a.time.localeCompare(b.time));

  function add(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setEvents((list) => [...list, { date: key(day), time, title: title.trim(), tone: 'primary' }]);
    setTitle('');
    notify('Compromisso agendado.', 'success');
  }

  return (
    <Panel title="Agenda" flush>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        <DateCalendar
          value={day}
          onChange={(d) => d && setDay(d)}
          referenceDate={TODAY}
          slots={{ day: EventDay }}
          slotProps={{ day: { marked } as Partial<PickerDayProps> }}
          sx={{ width: '100%', maxWidth: 340, height: 'auto', mx: 'auto' }}
        />
      </LocalizationProvider>
      <Box sx={{ px: 2.5, pb: 2.5 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, '&::first-letter': { textTransform: 'uppercase' } }}>
          {format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </Typography>
        <Stack spacing={1}>
          {ofDay.map((ev) => (
            <Stack key={ev.time + ev.title} direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <Dot tone={ev.tone} />
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 38 }}>
                {ev.time}
              </Typography>
              <Typography variant="body2">{ev.title}</Typography>
            </Stack>
          ))}
          {ofDay.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Nenhum compromisso neste dia.
            </Typography>
          )}
        </Stack>
        <Stack component="form" onSubmit={add} direction="row" sx={{ mt: 2, gap: 1, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            type="time"
            label="Hora"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            sx={{ width: 110, flexShrink: 0 }}
          />
          <TextField size="small" label="Compromisso" value={title} onChange={(e) => setTitle(e.target.value)} sx={{ flex: '1 1 140px' }} />
          <Button type="submit" variant="contained" fullWidth disabled={!title.trim()} startIcon={<Add size={18} />}>
            Agendar
          </Button>
        </Stack>
      </Box>
    </Panel>
  );
}
