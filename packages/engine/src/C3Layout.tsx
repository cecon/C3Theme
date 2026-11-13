// Moldura da shell pela spec: menu (`layout.menu`), cabeçalho (`layout.header`), usuário e rodapé do app.json em volta
// das telas. O <C3Shell> usa nas rotas; quem monta o EngineProvider no próprio app (vitrine, Storybook) usa direto,
// dentro de um roteador, com as telas no <Outlet />.

import { lazy, ReactNode, Suspense } from 'react';
import { useLocation } from 'react-router';

import {
  AppFooter,
  AppLayout,
  ColorModeButton,
  CommandSearch,
  DesktopOptions,
  flattenNav,
  FullscreenButton,
  PageRail,
  railStorageKey,
  resolveDesktop,
  ServerRail,
  SettingsButton,
  type PageRailItem,
  type PageRailProps,
  type ServerRailProps
} from '@c3theme/ui';
import { iconByName, useEngine, useText } from './context';
import SettingsLauncher from './settings/SettingsLauncher';
import ShellRailsFrame from './ShellRailsFrame';
import DeclaredSidebar from './sidebar/DeclaredSidebar';
import { ShellDockFrame } from './dock/ShellAgentDock';
import BranchSelector from './widgets/BranchSelector';
import NotificationBell from './widgets/NotificationBell';
import MenuCount from './widgets/MenuCount';
import { canOpenPage } from './routes';
import { buildMenu } from './shellMenu';
import { useSessionUser } from './auth/sessionUser';
import useRecordSearch from './hooks/useRecordSearch';
import { headerChat } from './chat/chatDef';

// o assistente traz o @c3theme/chat: só baixa quem tem `layout.header.assistant`
const AssistantButton = lazy(() => import('./chat/AssistantButton'));

/** Dados e ações dos railes (#116/#117) entregues pelo app; a spec declara só a zona. */
export interface ShellRailsPort {
  readonly servers?: ServerRailProps;
  readonly pages?: Partial<Omit<PageRailProps, 'pages'>>;
}

export interface C3LayoutProps {
  /** Rodapé do drawer (ex.: usuário logado e sair), que é do sistema e não da spec. */
  drawerFooter?: ReactNode;
  /** App de desktop sem barra de título. Sem isso, a moldura de `layout.desktop` (com a porta `desktopHost`). */
  desktop?: DesktopOptions;
  /** Rails de servidores e de páginas; só aparecem quando `layout.rails` declara a zona. */
  rails?: ShellRailsPort;
  settingsSection?: string;
}

export default function C3Layout({ drawerFooter, desktop, settingsSection, rails: suppliedRails }: C3LayoutProps) {
  const { app, entities, components, icons, pageAccess, desktop: frame, rails: liveRails, settingsPort } = useEngine();
  const rails = liveRails ?? suppliedRails;
  const text = useText();
  const location = useLocation();
  const header = app.layout.header ?? {};
  const recordSearch = useRecordSearch();
  const assistant = headerChat(header.assistant);

  // página registrada sem permissão some do menu (a rota também bloqueia)
  const menu = buildMenu(app, {
    entities,
    text,
    shown: (item) => canOpenPage(pageAccess, item.path),
    icon: (name) => iconByName(name, icons),
    badge: (item) => (item.badge && item.entity ? <MenuCount entity={item.entity} preset={item.preset} /> : undefined)
  });

  const footer = app.layout.footer;
  const user = useSessionUser();

  const layout = (
    <AppLayout
      menu={menu}
      sidebar={app.layout.sidebar ? (onNavigate) => <DeclaredSidebar def={app.layout.sidebar!} onNavigate={onNavigate} /> : undefined}
      navigationHidden={app.layout.sidebar?.hidden}
      breadcrumbs={false}
      drawerFooter={drawerFooter}
      desktop={desktop ?? frame?.options}
      user={user}
      userPlacement={app.layout.user}
      header={
        <>
          {header.search !== false && <CommandSearch search={recordSearch} />}
          <BranchSelector />
          {header.actions?.map((name) => {
            const Action = components[name];
            return Action ? <Action key={name} /> : null;
          })}
          {assistant && (
            <Suspense fallback={null}>
              <AssistantButton def={assistant} />
            </Suspense>
          )}
          {header.notifications && <NotificationBell />}
          <ColorModeButton />
          {header.fullscreen !== false && <FullscreenButton />}
          {header.settings !== false &&
            (app.settings === undefined ? (
              <SettingsButton />
            ) : (
              <SettingsLauncher
                def={app.settings}
                port={settingsPort}
                {...(settingsSection === undefined ? {} : { initialSection: settingsSection })}
              />
            ))}
        </>
      }
      footer={
        footer === null ? null : (
          <AppFooter
            text={footer?.text ? text(footer.text) : undefined}
            links={(footer?.links ?? []).map((l) => ({ label: text(l.label), href: l.href ?? l.path ?? '#' }))}
          />
        )
      }
    />
  );

  const zonas = app.layout.rails;
  if (zonas === undefined) {
    return <ShellDockFrame>{layout}</ShellDockFrame>;
  }

  const paginas = flattenNav(menu)
    .map(({ item }) => item)
    .filter((item, i, all) => item.external !== true && item.url !== undefined && all.findIndex((other) => other.url === item.url) === i)
    .filter((item) => !zonas.pages?.items || zonas.pages.items.includes(item.url!))
    .map((item, index) => ({
      id: item.url!,
      title: item.title,
      url: item.url as string,
      icon: item.icon as PageRailItem['icon'],
      fixed: index === 0
    }));
  const options = desktop ?? frame?.options;
  const controls = options && resolveDesktop(options).controls;
  const controlsLeft = controls?.side === 'left';
  const defaultStorage = railStorageKey(app.name);

  return (
    <ShellDockFrame>
      <ShellRailsFrame
        topInset={controlsLeft ? controls.height : 0}
        rails={
          <>
            {zonas.servers !== undefined && rails?.servers !== undefined && (
              <ServerRail
                {...rails.servers}
                shortcut={zonas.servers.shortcuts ?? rails.servers.shortcut}
                storageKey={rails.servers.storageKey ?? defaultStorage}
                localServerId={zonas.servers.localServerId}
              />
            )}
            {zonas.pages !== undefined && (
              <PageRail
                pages={paginas}
                activePath={location.pathname + location.search}
                brand={{ label: app.name, ...(zonas.pages.brandHref === undefined ? {} : { href: zonas.pages.brandHref }) }}
                defaultPinned={zonas.pages.defaultPinned ?? []}
                {...rails?.pages}
                storageKey={rails?.pages?.storageKey ?? defaultStorage}
                hidden={zonas.pages.hidden || rails?.pages?.hidden}
                hideBrand={controlsLeft || rails?.pages?.hideBrand}
              />
            )}
          </>
        }
      >
        {layout}
      </ShellRailsFrame>
    </ShellDockFrame>
  );
}
