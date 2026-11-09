// Moldura da shell pela spec: menu (`layout.menu`), cabeçalho (`layout.header`), usuário e rodapé do app.json em volta
// das telas. O <C3Shell> usa nas rotas; quem monta o EngineProvider no próprio app (vitrine, Storybook) usa direto,
// dentro de um roteador, com as telas no <Outlet />.

import { ReactNode } from 'react';

import { AppFooter, AppLayout, ColorModeButton, CommandSearch, DesktopOptions, FullscreenButton, SettingsButton } from '@c3theme/ui';
import { iconByName, useEngine, useText } from './context';
import BranchSelector from './widgets/BranchSelector';
import NotificationBell from './widgets/NotificationBell';
import MenuCount from './widgets/MenuCount';
import { canOpenPage } from './routes';
import { buildMenu } from './shellMenu';
import { useSessionUser } from './auth/sessionUser';

export interface C3LayoutProps {
  /** Rodapé do drawer (ex.: usuário logado e sair), que é do sistema e não da spec. */
  drawerFooter?: ReactNode;
  /** App de desktop sem barra de título: repassado ao `AppLayout`. */
  desktop?: DesktopOptions;
}

export default function C3Layout({ drawerFooter, desktop }: C3LayoutProps) {
  const { app, entities, components, icons, pageAccess } = useEngine();
  const text = useText();
  const header = app.layout.header ?? {};

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

  return (
    <AppLayout
      menu={menu}
      breadcrumbs={false}
      drawerFooter={drawerFooter}
      desktop={desktop}
      user={user}
      userPlacement={app.layout.user}
      header={
        <>
          {header.search !== false && <CommandSearch />}
          <BranchSelector />
          {header.actions?.map((name) => {
            const Action = components[name];
            return Action ? <Action key={name} /> : null;
          })}
          {header.notifications && <NotificationBell />}
          <ColorModeButton />
          {header.fullscreen !== false && <FullscreenButton />}
          {header.settings !== false && <SettingsButton />}
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
}
