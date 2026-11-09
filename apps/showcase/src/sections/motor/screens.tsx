// Telas do motor dentro da vitrine, cada uma com a barra do JSON que a monta e o link para a versão em código.

import { lazy, ReactNode, Suspense } from 'react';
import { useParams } from 'react-router';

import { EntityBoard, EntityCalendar, EntityForm, EntityHome } from '@c3theme/engine';
import type { DashboardDef } from '@c3theme/engine';
import { PanelSkeleton } from '@c3theme/ui';
import JsonSpec from './JsonSpec';
import { APP } from './spec';

// o painel traz a biblioteca de gráficos: só baixa quem abre
const EntityDashboard = lazy(() => import('@c3theme/engine').then((m) => ({ default: m.EntityDashboard })));

/** Tela em código equivalente a cada tela do motor, para comparar. */
export const CODE_PATH: Record<string, string> = {
  pessoa: '/tabelas/dados/paginacao',
  'fatura/new': '/apps/faturas/nova',
  'tarefa/board': '/apps/kanban/quadro'
};

/** Arquivos da spec que uma tela da entidade lê: ela, as filhas e os alvos de reference. */
export const FILES: Record<string, string[]> = {
  pessoa: ['pessoa'],
  cliente: ['cliente'],
  fatura: ['fatura', 'fatura_item'],
  fatura_item: ['fatura_item', 'fatura'],
  tarefa: ['tarefa', 'membro'],
  membro: ['membro'],
  evento: ['evento'],
  cliente_fatura: ['cliente_fatura'],
  notificacao: ['notificacao'],
  receita_mes: ['receita_mes']
};

/** Telas que já substituíram a versão em código no menu: aparecem como a tela do sistema, sem a barra do JSON. */
const SWAPPED = new Set(['cliente', 'fatura', 'evento']);

interface ScreenProps {
  files: string[];
  code?: string;
  /** Já é a tela do sistema (o painel de faturas); sem ele, vale a entidade estar em SWAPPED. */
  swapped?: boolean;
  children: ReactNode;
}

function Screen({ files, code, swapped = SWAPPED.has(files[0]), children }: ScreenProps) {
  if (swapped) return <>{children}</>;
  return (
    <>
      <JsonSpec files={files} codePath={code} />
      {children}
    </>
  );
}

export function ListScreen({ entity }: { entity: string }) {
  return (
    <Screen files={FILES[entity]} code={CODE_PATH[entity]}>
      <EntityHome key={entity} entity={entity} />
    </Screen>
  );
}

export function NewScreen({ entity }: { entity: string }) {
  return (
    <Screen files={FILES[entity]} code={CODE_PATH[`${entity}/new`]}>
      <EntityForm key={`${entity}-new`} entity={entity} />
    </Screen>
  );
}

export function RecordScreen({ entity }: { entity: string }) {
  const { id } = useParams();
  return (
    <Screen files={FILES[entity]}>
      <EntityForm key={`${entity}-${id}`} entity={entity} id={id} />
    </Screen>
  );
}

export function BoardScreen({ entity }: { entity: string }) {
  return (
    <Screen files={FILES[entity]} code={CODE_PATH[`${entity}/board`]}>
      <EntityBoard key={entity} entity={entity} />
    </Screen>
  );
}

export function CalendarScreen({ entity }: { entity: string }) {
  return (
    <Screen files={FILES[entity]} code={CODE_PATH[`${entity}/calendar`]}>
      <EntityCalendar key={entity} entity={entity} />
    </Screen>
  );
}

const dashboard = APP.pages?.find((p) => p.path === '/apps/faturas/painel')?.dashboard as DashboardDef;

export function DashboardScreen() {
  return (
    <Screen files={['app', 'fatura', 'cliente_fatura', 'notificacao', 'receita_mes']} swapped>
      <Suspense fallback={<PanelSkeleton />}>
        <EntityDashboard dashboard={dashboard} />
      </Suspense>
    </Screen>
  );
}
