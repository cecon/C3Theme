import { useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate, useSearchParams } from 'react-router';
import useSWR from 'swr';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Theme, useTheme } from '@mui/material/styles';

// third-party
import type { EventApi, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';

import { CalendarToolbar, calendarStyles, notify, PageLoader, Panel, type CalendarView } from '@c3theme/ui';
import { dayKey, monthParam, movedPatch, parseMonth, rangeWhere, toItem } from '../../calendar';
import { useEngine, useText } from '../../context';
import { newLabel } from '../../formValues';
import type { WireRecord } from '../../types';
import { fcLocale } from './fcLocale';
import { saveMove } from './saveMove';
import { availableViews, listUpTo, recordTitle } from '../../views';
import EntityDialog from '../EntityDialog';
import { PresetChips, ViewSwitcher } from '../views/ViewBar';
import { useViewPreset } from '../views/useViewPreset';
import { joinAnd } from '../list/useListQuery';
import { withPreset } from '../../presetTabs';
import { useLive } from '../../live/useLive';
import { eventTone } from '../../calendarTone';
import { fillHref } from '../list/columnHref';
import { initialView, SLOT } from './calendarMode';

/** Mais que isso no período é sinal de que falta um filtro; a tela avisa em vez de pedir tudo. */
const LIMIT = 500;

/** O calendário em si (FullCalendar no tema C3); o mês fica na URL (`?month=2026-10`). */
export default function CalendarBoard({ entity }: { entity: string }) {
  const { client, entities, org } = useEngine();
  const { def, capabilities } = entities[entity];
  useLive(def);
  const text = useText();
  const theme = useTheme();
  const intl = useIntl();
  const mobile = useMediaQuery((t: Theme) => t.breakpoints.down('sm'));
  const compact = useMediaQuery((t: Theme) => t.breakpoints.down('md'));
  const [params, setParams] = useSearchParams();
  const { preset, presetId, setPreset } = useViewPreset(def);
  const ref = useRef<FullCalendar>(null);
  const view = def.views?.calendar;
  const type = def.fields.find((f) => f.name === view?.start)?.type === 'datetime' ? 'datetime' : 'date';
  const navigate = useNavigate();

  const [mode, setMode] = useState<CalendarView>(initialView(view?.range, mobile));
  const [title, setTitle] = useState('');
  const [range, setRange] = useState<{ from: Date; to: Date }>();
  const [dialog, setDialog] = useState<{ id?: string; edit?: boolean; initial?: WireRecord } | null>(null);
  const { year, month } = parseMonth(params.get('month'));

  // no celular a visão padrão é a agenda; ao voltar para tela larga, a do `range` (padrão o mês)
  useEffect(() => {
    const next = initialView(view?.range, mobile);
    setMode(next);
    ref.current?.getApi().changeView(next);
  }, [mobile, view?.range]);

  const where = useMemo(() => {
    if (!view || !range) return undefined;
    const period = rangeWhere(view, type, range.from, range.to);
    return joinAnd(withPreset(preset, [period]));
  }, [view, type, range, preset]);
  const { data, error, isLoading, mutate } = useSWR(
    where ? ['c3-list', entity, 'calendar', JSON.stringify(where), org?.active] : null,
    () => listUpTo(client, entity, { where, sort: view!.start }, LIMIT),
    { keepPreviousData: true }
  );

  const events = useMemo<EventInput[]>(
    () =>
      view
        ? (data?.rows ?? []).flatMap((r) => {
            const item = toItem(r, view, type, recordTitle(def, r) || `#${r.id}`);
            return item ? [{ ...item, classNames: [`ev-${eventTone(view.color, def, r)}`] }] : [];
          })
        : [],
    [data, view, type, def]
  );

  if (!view) return <Alert severity="warning">{`${text(def.label.plural)} não declara views.calendar.`}</Alert>;

  const api = () => ref.current?.getApi();
  const changeMode = (next: CalendarView) => {
    setMode(next);
    api()?.changeView(next);
  };
  // arrastar ou esticar grava na hora; recusado, o evento volta para onde estava
  async function move(ev: EventApi, revert: () => void) {
    const row = data?.rows.find((r) => r.id === ev.id);
    const patch = movedPatch({ start: ev.start!, end: ev.end, allDay: ev.allDay }, view!, type);
    const out = await saveMove(client, entity, ev.id, patch, row?._version, revert);
    notify(out.message, out.ok ? 'success' : 'error');
    if (out.ok) mutate();
  }
  // a troca para a lista só aparece quando há outra visão além da agenda (que já é a lista do período)
  const others = availableViews(def).filter((v) => v !== 'list' && v !== 'calendar');

  return (
    <Panel flush>
      <CalendarToolbar
        title={title}
        view={mode}
        compact={compact}
        onToday={() => api()?.today()}
        onPrev={() => api()?.prev()}
        onNext={() => api()?.next()}
        onView={changeMode}
        onAdd={capabilities.create ? () => setDialog({ initial: preset?.defaults }) : undefined}
        addLabel={newLabel(def, text)}
        extra={others.length > 0 ? <ViewSwitcher def={def} current="calendar" preset={presetId} /> : undefined}
      />
      <PresetChips def={def} presetId={presetId} onChange={setPreset} />
      <Divider />
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error.message}
        </Alert>
      )}
      {data && data.total > data.rows.length && (
        <Alert severity="warning" sx={{ m: 2 }}>
          {`Mostrando ${data.rows.length} de ${data.total} registros neste período. Use um filtro para ver todos.`}
        </Alert>
      )}
      {isLoading && data && <PageLoader />}
      <Box sx={calendarStyles(theme)}>
        <FullCalendar
          ref={ref}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={mode}
          // sem mês na URL, abre em hoje (na semana, a semana de hoje, não a do dia 1º)
          initialDate={params.has('month') ? `${monthParam(year, month)}-01` : undefined}
          locale={fcLocale(intl.locale)}
          direction={theme.direction}
          headerToolbar={false}
          events={events}
          height={mobile ? 'auto' : 720}
          dayMaxEventRows={3}
          eventDisplay="block"
          nowIndicator
          selectable={capabilities.create}
          selectMirror
          editable={capabilities.update}
          eventResizableFromStart
          longPressDelay={300}
          scrollTime="08:00:00"
          slotDuration={SLOT[view.slot ?? '30min']}
          // sem campo de dia inteiro, nenhum evento cai na faixa "dia inteiro" da semana: ela só ocuparia espaço
          allDaySlot={type === 'date' || Boolean(view.allDay)}
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          // o FullCalendar nomeia a célula do dia só pelo número; com eventos dentro, o nome fica sem o texto visível
          // (WCAG 2.5.3): a célula passa a se nomear pelo conteúdo, número e eventos
          dayCellDidMount={({ el }) => el.removeAttribute('aria-labelledby')}
          datesSet={(arg) => {
            setTitle(arg.view.title.charAt(0).toUpperCase() + arg.view.title.slice(1));
            setRange({ from: arg.start, to: arg.end });
            // o mês que aparece fica na URL: voltar e compartilhar abrem no mesmo mês
            const shown = monthParam(arg.view.currentStart.getFullYear(), arg.view.currentStart.getMonth());
            const today = dayKey(new Date()).slice(0, 7);
            if (shown !== (params.get('month') ?? today))
              setParams(
                (prev) => {
                  const next = new URLSearchParams(prev);
                  if (shown === today) next.delete('month');
                  else next.set('month', shown);
                  return next;
                },
                { replace: true }
              );
          }}
          select={(arg) => {
            arg.view.calendar.unselect();
            setDialog({
              initial: { ...preset?.defaults, ...movedPatch({ start: arg.start, end: arg.end, allDay: arg.allDay }, view, type) }
            });
          }}
          eventClick={(arg) => {
            arg.jsEvent.preventDefault();
            // `open.href`: o evento leva a outra tela (o pedido da agenda de entregas), com os campos do registro
            const row = data?.rows.find((r) => r.id === arg.event.id);
            const to = view.open && row ? fillHref(view.open.href, row) : undefined;
            if (to) return navigate(to);
            // como na agenda em código: quem pode alterar já abre editando
            setDialog({ id: arg.event.id, edit: capabilities.update });
          }}
          eventDrop={(arg) => move(arg.event, arg.revert)}
          eventResize={(arg) => move(arg.event, arg.revert)}
          noEventsContent="Nenhum evento neste período."
        />
      </Box>
      <EntityDialog
        open={dialog && { id: dialog.id, edit: dialog.edit }}
        entity={entity}
        initial={dialog?.initial}
        onClose={(changed) => {
          setDialog(null);
          if (changed) mutate();
        }}
      />
    </Panel>
  );
}
