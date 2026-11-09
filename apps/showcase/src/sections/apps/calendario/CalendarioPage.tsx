import { useEffect, useMemo, useRef, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR as pickersPtBR } from '@mui/x-date-pickers/locales';

// third-party
import type { DateSelectArg, EventApi, EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { type EventResizeDoneArg } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { addHours, setHours, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { CalendarToolbar, calendarStyles, notify } from '@c3theme/ui';
import type { CalendarView } from '@c3theme/ui';
import { CalendarEvent, SAMPLE_EVENTS } from './data';
import EventDialog, { EventDraft } from './EventDialog';

const pickerText = pickersPtBR.components.MuiLocalizationProvider.defaultProps.localeText;

function toInput(e: CalendarEvent): EventInput {
  return {
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    classNames: [`ev-${e.tone}`],
    extendedProps: { description: e.description }
  };
}

/** Novo rascunho a partir de hoje às 9h. */
function blankDraft(): EventDraft {
  const start = setHours(startOfDay(new Date()), 9);
  return { title: '', description: '', allDay: false, start, end: addHours(start, 1), tone: 'primary' };
}

export default function CalendarioPage() {
  const theme = useTheme();
  const mobile = useMediaQuery((t: Theme) => t.breakpoints.down('sm'));
  const compact = useMediaQuery((t: Theme) => t.breakpoints.down('md'));
  const calendarRef = useRef<FullCalendar>(null);

  const [events, setEvents] = useState<CalendarEvent[]>(SAMPLE_EVENTS);
  const [view, setView] = useState<CalendarView>(mobile ? 'listWeek' : 'dayGridMonth');
  const [title, setTitle] = useState('');
  const [draft, setDraft] = useState<EventDraft | null>(null);

  const api = () => calendarRef.current?.getApi();

  // no celular a visão padrão é a agenda; ao voltar para tela larga, o mês
  useEffect(() => {
    const next: CalendarView = mobile ? 'listWeek' : 'dayGridMonth';
    setView(next);
    calendarRef.current?.getApi().changeView(next);
  }, [mobile]);

  const inputs = useMemo(() => events.map(toInput), [events]);

  function changeView(next: CalendarView) {
    setView(next);
    api()?.changeView(next);
  }

  function handleSelect(arg: DateSelectArg) {
    arg.view.calendar.unselect();
    setDraft({ title: '', description: '', allDay: arg.allDay, start: arg.start, end: arg.end, tone: 'primary' });
  }

  function handleClick(arg: EventClickArg) {
    arg.jsEvent.preventDefault();
    const found = events.find((e) => e.id === arg.event.id);
    if (found) setDraft({ ...found });
  }

  // arrastar ou redimensionar: atualiza datas a partir do evento do FullCalendar
  function applyMove(ev: EventApi, message: string) {
    setEvents((list) =>
      list.map((e) => {
        if (e.id !== ev.id || !ev.start) return e;
        const start = ev.start;
        const end = ev.end ?? (ev.allDay ? startOfDay(addHours(start, 24)) : addHours(start, 1));
        return { ...e, start, end, allDay: ev.allDay };
      })
    );
    notify(message, 'success');
  }

  function save(event: CalendarEvent) {
    const exists = events.some((e) => e.id === event.id);
    setEvents((list) => (exists ? list.map((e) => (e.id === event.id ? event : e)) : [...list, event]));
    notify(exists ? 'Evento atualizado.' : 'Evento criado.', 'success');
    setDraft(null);
  }

  function remove(id: string) {
    setEvents((list) => list.filter((e) => e.id !== id));
    notify('Evento excluído.', 'success');
    setDraft(null);
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR} localeText={pickerText}>
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <CalendarToolbar
          title={title}
          view={view}
          compact={compact}
          onToday={() => api()?.today()}
          onPrev={() => api()?.prev()}
          onNext={() => api()?.next()}
          onView={changeView}
          onAdd={() => setDraft(blankDraft())}
        />
        <Divider />
        <Box sx={calendarStyles(theme)}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView={view}
            locale={ptBrLocale}
            direction={theme.direction}
            headerToolbar={false}
            events={inputs}
            height={mobile ? 'auto' : 720}
            dayMaxEventRows={3}
            eventDisplay="block"
            nowIndicator
            selectable
            selectMirror
            editable
            eventResizableFromStart
            longPressDelay={300}
            scrollTime="08:00:00"
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            datesSet={(arg) => setTitle(arg.view.title.charAt(0).toUpperCase() + arg.view.title.slice(1))}
            select={handleSelect}
            eventClick={handleClick}
            eventDrop={(arg: EventDropArg) => applyMove(arg.event, 'Evento movido.')}
            eventResize={(arg: EventResizeDoneArg) => applyMove(arg.event, 'Duração do evento alterada.')}
            noEventsContent="Nenhum evento neste período."
          />
        </Box>
      </Paper>

      {draft && <EventDialog key={draft.id ?? 'novo'} draft={draft} onClose={() => setDraft(null)} onSave={save} onDelete={remove} />}
    </LocalizationProvider>
  );
}
