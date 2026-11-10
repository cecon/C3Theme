// As telas de operação que o motor monta das views da entidade (quadro, agenda, relatório, planta, cartões) e o painel de uma
// página do app.json. A história só diz qual entidade e qual visão, ou qual página.

import type { ComponentType } from 'react';

import { EntityBoard, EntityCalendar, EntityDashboard, EntityList, EntityMap, EntityReport } from '@c3theme/engine';

import { pageDef } from './source';

export interface MotorViewProps {
  /** Entidade da spec do Storybook (sem `page`). */
  entity?: string;
  /** Visão da entidade (`views.board`, `.calendar`, `.report`, `.map`, `.gallery`). */
  view?: 'board' | 'calendar' | 'report' | 'map' | 'gallery';
  /** Caminho da página do app.json com `dashboard`. */
  page?: string;
}

const Gallery = ({ entity }: { entity: string }) => <EntityList entity={entity} view="gallery" />;
const VIEWS: Record<string, ComponentType<{ entity: string }>> = {
  board: EntityBoard,
  calendar: EntityCalendar,
  report: EntityReport,
  map: EntityMap,
  gallery: Gallery
};

export default function MotorView({ entity, view = 'board', page }: MotorViewProps) {
  if (page) return <EntityDashboard key={page} dashboard={pageDef(page).dashboard!} />;
  const View = VIEWS[view];
  return <View key={`${entity}-${view}`} entity={entity!} />;
}
