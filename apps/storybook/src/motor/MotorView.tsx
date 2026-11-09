// As telas de operação que o motor monta das views da entidade (quadro, agenda, relatório, planta) e o painel de uma
// página do app.json. A história só diz qual entidade e qual visão, ou qual página.

import { EntityBoard, EntityCalendar, EntityDashboard, EntityMap, EntityReport } from '@c3theme/engine';

import { pageDef } from './source';

export interface MotorViewProps {
  /** Entidade da spec do Storybook (sem `page`). */
  entity?: string;
  /** Visão da entidade (`views.board`, `.calendar`, `.report`, `.map`). */
  view?: 'board' | 'calendar' | 'report' | 'map';
  /** Caminho da página do app.json com `dashboard`. */
  page?: string;
}

const VIEWS = { board: EntityBoard, calendar: EntityCalendar, report: EntityReport, map: EntityMap };

export default function MotorView({ entity, view = 'board', page }: MotorViewProps) {
  if (page) return <EntityDashboard key={page} dashboard={pageDef(page).dashboard!} />;
  const View = VIEWS[view];
  return <View key={`${entity}-${view}`} entity={entity!} />;
}
