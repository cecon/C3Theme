// Rotas da shell: cada entidade tem lista (ou o formulário do registro único, em singleton), quadro, calendário, novo e registro; as páginas custom vêm de app.pages.

import { lazy, ReactNode, Suspense } from 'react';
import { Navigate, RouteObject, useLocation, useParams } from 'react-router';

// material-ui
import Alert from '@mui/material/Alert';

import PageStatesFrame from './pageStates/PageStatesFrame';
import { PageStateView } from './pageStates/PageStateView';
import { PanelSkeleton } from '@c3theme/ui';
import { useEngine } from './context';
import type { DashboardDef } from './dashboard';
import EntityBoard from './pages/board/EntityBoard';
import EntityCalendar from './pages/calendar/EntityCalendar';
import EntityReport from './pages/report/EntityReport';
import EntityMap from './pages/map/EntityMap';
import EntityForm from './pages/EntityForm';
import EntityHome from './pages/EntityHome';
import EntityList from './pages/EntityList';
import type { AppDef, MenuItemDef, PageDef } from './types';
import { viewPath } from './views';
import WizardGuard from './pages/wizard/WizardGuard';
import WizardPage from './pages/wizard/WizardPage';
import { AppStatus } from './status/AppStatus';
import { NotFoundScreen, RouteErrorScreen } from './status/ErrorScreens';
import { PAGE_SOON_MESSAGE } from './status/status';

// o painel traz a biblioteca de gráficos: só baixa quem abre um
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const ApiDocs = lazy(() => import('./pages/apiDocs/ApiDocs'));
// o chat traz o @c3theme/chat: só baixa quem abre a página
const ChatPage = lazy(() => import('./chat/ChatPage'));
// o editor de fluxo traz o canvas (React Flow): também só baixa quem abre
const EntityFlow = lazy(() => import('./pages/flow/EntityFlow'));

export function homePath(app?: AppDef) {
  const first = app?.layout.menu[0]?.items[0];
  return first ? (itemUrl(first) ?? '/') : '/';
}

export function itemUrl(item: MenuItemDef): string | undefined {
  if (item.entity) return viewPath(item.entity, item.view ?? 'list', item.preset);
  return item.path ?? item.href;
}

/**
 * O que muda as rotas: entidades, páginas e início. O roteador só é recriado quando isso muda; trocar só o menu
 * (recarregar o app) não remonta as páginas abertas.
 */
export const routesKey = (app: AppDef) => JSON.stringify([app.entities, app.pages ?? [], app.homePath ?? null]);

export function buildRoutes(app: AppDef, layout: ReactNode, extra: RouteObject[] = []): RouteObject[] {
  const pages = app.pages ?? [];
  const pageRoute = (p: (typeof pages)[number]): RouteObject => ({
    path: p.path,
    errorElement: <RouteErrorScreen fullScreen={p.layout === 'blank'} />,
    element: (
      <PageGate path={p.path} states={p.states}>
        {p.layout === 'blank' ? <WizardGuard>{pageBody(p)}</WizardGuard> : pageBody(p)}
      </PageGate>
    )
  });

  return [
    {
      path: '/',
      errorElement: <RouteErrorScreen fullScreen />,
      element: <WizardGuard>{layout}</WizardGuard>,
      // erro numa tela fica nela: o menu continua em volta
      children: inLayout([
        { index: true, element: <Navigate to={app.homePath ?? homePath(app)} replace /> },
        ...app.entities.flatMap((e) => [
          { path: e, element: <EntityHome key={e} entity={e} /> },
          { path: `${e}/new`, element: <EntityForm key={`${e}-new`} entity={e} /> },
          // rotas fixas ganham do `:id`; o id de um registro nunca é 'gallery', 'board', 'calendar', 'report' nem 'map' (README da spec)
          { path: `${e}/gallery`, element: <EntityList key={`${e}-gallery`} entity={e} view="gallery" /> },
          { path: `${e}/board`, element: <EntityBoard key={`${e}-board`} entity={e} /> },
          { path: `${e}/calendar`, element: <EntityCalendar key={`${e}-calendar`} entity={e} /> },
          { path: `${e}/report`, element: <EntityReport key={`${e}-report`} entity={e} /> },
          { path: `${e}/map`, element: <EntityMap key={`${e}-map`} entity={e} /> },
          { path: `${e}/:id`, element: <RecordRoute entity={e} /> },
          { path: `${e}/:id/flow`, element: <FlowRoute entity={e} /> }
        ]),
        ...pages.filter((p) => p.layout !== 'blank').map(pageRoute),
        ...extra,
        { path: '*', element: <NotFoundScreen /> }
      ])
    },
    ...pages.filter((p) => p.layout === 'blank').map(pageRoute)
  ];
}

const inLayout = (routes: RouteObject[]): RouteObject[] => routes.map((r) => ({ errorElement: <RouteErrorScreen />, ...r }));

function RecordRoute({ entity }: { entity: string }) {
  const { id } = useParams();
  return <EntityForm key={`${entity}-${id}`} entity={entity} id={id} />;
}

function FlowRoute({ entity }: { entity: string }) {
  const { id } = useParams();
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <EntityFlow key={`${entity}-${id}`} entity={entity} id={id!} />
    </Suspense>
  );
}

function pageBody(p: PageDef) {
  if (p.comingSoon) return <SoonPage soon={p.comingSoon} />;
  if (p.dashboard) return <DashboardPage dashboard={p.dashboard} states={p.states} />;
  if (p.wizard) return <WizardPage wizard={p.wizard} />;
  if (!p.apiDocs && !p.chat) return <CustomPage page={p} />;
  return <Suspense fallback={<PanelSkeleton />}>{p.chat ? <ChatPage def={p.chat} /> : <ApiDocs def={p.apiDocs!} />}</Suspense>;
}

/** Página ainda não pronta: o "Em breve" do sistema, na área de conteúdo. */
function SoonPage({ soon }: { soon: NonNullable<PageDef['comingSoon']> }) {
  return <AppStatus fullScreen={false} status={{ mode: 'comingSoon', message: soon.message ?? PAGE_SOON_MESSAGE, until: soon.until }} />;
}

function DashboardPage({ dashboard, states }: { dashboard: DashboardDef; states?: PageDef['states'] }) {
  return (
    <Suspense fallback={states ? <PageStateView kind="loading" state={states.loading} retry={() => {}} /> : <PanelSkeleton />}>
      <Dashboard dashboard={dashboard} />
    </Suspense>
  );
}

/** Página com `permission` que o backend negou (em /_meta/app); sem `permission`, abre. */
export const canOpenPage = (access: Record<string, boolean> | undefined, path: string | undefined) => !path || access?.[path] !== false;

/** Bloqueia a rota da página (registrada ou painel) sem permissão na filial ativa; o menu já a esconde. */
function PageGate({ path, states, children }: { path: string; states?: PageDef['states']; children: ReactNode }) {
  const { pageAccess } = useEngine();
  const location = useLocation();
  if (!canOpenPage(pageAccess, path) && states?.forbidden)
    return <PageStateView kind="forbidden" state={states.forbidden} retry={() => {}} />;
  if (!canOpenPage(pageAccess, path)) return <Alert severity="info">Você não tem permissão para abrir esta página.</Alert>;
  return states ? (
    <PageStatesFrame key={location.pathname} states={states}>
      {children}
    </PageStatesFrame>
  ) : (
    children
  );
}

/** Props da página registrada: o `config` do app.json (já validado pelo schema do componente) e a própria página. */
export interface CustomPageProps {
  config: Record<string, unknown>;
  page: PageDef;
}

function CustomPage({ page }: { page: PageDef }) {
  const { components } = useEngine();
  const component = page.component ?? '';
  const Page = components[component];
  if (!Page) return <Alert severity="warning">{`Página usa o componente '${component}', que este sistema não registrou.`}</Alert>;
  return <Page config={page.config ?? {}} page={page} />;
}
