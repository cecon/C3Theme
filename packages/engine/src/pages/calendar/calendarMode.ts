// Visão inicial e faixa de hora do calendário da entidade (`views.calendar.range` e `.slot`, #65). Sem React.

import type { CalendarView as Mode } from '@c3theme/ui';

import type { CalendarView } from '../../types';

const MODE: Record<NonNullable<CalendarView['range']>, Mode> = { month: 'dayGridMonth', week: 'timeGridWeek', day: 'timeGridDay' };

/** No celular, sempre a agenda (a grade da semana não cabe); na tela larga, a do `range`, padrão o mês. */
export const initialView = (range: CalendarView['range'], mobile: boolean): Mode => (mobile ? 'listWeek' : MODE[range ?? 'month']);

/** Duração da faixa de hora no formato do FullCalendar. */
export const SLOT: Record<NonNullable<CalendarView['slot']>, string> = { hour: '01:00:00', '30min': '00:30:00' };
