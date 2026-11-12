// As telas de operação que o motor monta das views da entidade (quadro, agenda, relatório, planta, cartões) e o painel de uma
// página do app.json. A história só diz qual entidade e qual visão, ou qual página.

import type { ComponentType } from 'react';
import { Route, Routes } from 'react-router';

import Box from '@mui/material/Box';

import {
  ApiDocs,
  ChatPage,
  ChatPanel,
  EntityBoard,
  EntityCalendar,
  EntityDashboard,
  EntityList,
  EntityMap,
  EntityReport,
  WizardPage
} from '@c3theme/engine';

import { pageDef } from './source';

export interface MotorViewProps {
  /** Entidade da spec do Storybook (sem `page`). */
  entity?: string;
  /** Visão da entidade (`views.board`, `.calendar`, `.report`, `.map`, `.gallery`). */
  view?: 'board' | 'calendar' | 'report' | 'map' | 'gallery';
  /** Caminho da página do app.json com `dashboard`, `apiDocs`, `wizard` ou `chat`. */
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
  const def = page ? pageDef(page) : undefined;
  if (def?.apiDocs) return <ApiDocs key={page} def={def.apiDocs} />;
  if (def?.wizard) return <WizardPage key={page} wizard={def.wizard} />;
  // conversa pelo parâmetro da rota (ADR 0009): a história abre o endereço em `parameters.route`
  if (def?.chat && page?.includes(':'))
    return (
      <Routes>
        <Route path={page} element={<ChatPage def={def.chat} path={page} />} />
      </Routes>
    );
  if (def?.chat)
    return (
      <Box sx={{ height: 640, display: 'flex', flexDirection: 'column', border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <ChatPanel key={page} def={def.chat} />
      </Box>
    );
  if (def) return <EntityDashboard key={page} dashboard={def.dashboard!} />;
  const View = VIEWS[view];
  return <View key={`${entity}-${view}`} entity={entity!} />;
}
