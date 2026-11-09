import { lazy, Suspense } from 'react';

import { PanelSkeleton } from '@c3theme/ui';

// o FullCalendar só baixa quando alguém abre um calendário
const CalendarBoard = lazy(() => import('./CalendarBoard'));

/** Calendário da entidade, montado por `views.calendar`: mês, semana, dia e agenda, com arrastar para remarcar. */
export default function EntityCalendar({ entity }: { entity: string }) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <CalendarBoard entity={entity} />
    </Suspense>
  );
}
