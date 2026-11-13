import { ReactNode, useEffect, useState } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router';

// material-ui
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import GlobalStyles from '@mui/material/GlobalStyles';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme, type Theme } from '@mui/material/styles';

// third-party
import { HamburgerMenu } from 'iconsax-reactjs';

import Logo from '../components/Logo';
import { useBranding, useUiConfig } from '../config';
import { useHeaderHeight } from '../theme/density';
import Breadcrumbs from './Breadcrumbs';
import { controlsInset, DesktopOptions, dragRegionSx, HEADER_OPACITY, seeThrough, translucentSidebarSx, useAppFrame } from './desktop';
import DrawerBrand from './DrawerBrand';
import { useDocumentTitle } from './documentTitle';
import { FillContext } from './FillHeight';
import HorizontalNav from './HorizontalNav';
import { NavContext, NavGroup } from './nav';
import { warnNav } from './navLint';
import RailDrawer from './RailDrawer';
import UserMenu, { UserMenuProps } from './UserMenu';
import VerticalNav from './VerticalNav';
import { useUiText } from '../i18n';

export const DRAWER_WIDTH = 264;
export const MINI_DRAWER_WIDTH = 76;
/** Altura do cabeçalho na densidade de site; no tema compacto é 52 (use `useHeaderHeight`). */
export const HEADER_HEIGHT = 64;

export interface AppLayoutProps {
  menu: NavGroup[];
  /** Conteúdo do header à direita do botão de menu (busca, ações, usuário). */
  header?: ReactNode;
  /** Rodapé do conteúdo; `null` esconde. */
  footer?: ReactNode | null;
  /** Fixo no pé do menu lateral, acima do usuário. Some com o menu recolhido. */
  drawerFooter?: ReactNode;
  /** Usuário logado: a shell desenha o menu de conta no lugar de `userPlacement`. */
  user?: Omit<UserMenuProps, 'placement'>;
  /**
   * `header` (padrão): avatar à direita do cabeçalho. `drawer`: cartão no pé do menu lateral
   * (só o avatar com o menu recolhido); com o menu em barra, volta para o cabeçalho.
   */
  userPlacement?: 'header' | 'drawer';
  /** Caminho da página (vindo do menu) acima do conteúdo. Padrão: ligado. */
  breadcrumbs?: boolean;
  /** Título da aba pela tela do menu ("Tela · Grupo · Marca"). Padrão: ligado; desligue se o app cuida disso. */
  documentTitle?: boolean;
  /**
   * App de desktop com a janela sem barra de título (Electron `titleBarStyle: 'hiddenInset'` ou `titleBarOverlay`):
   * cabeçalho e topo do menu arrastam a janela, os botões da janela ganham espaço e o menu pode ficar translúcido.
   * Fonte do sistema e densidade compacta vão no tema: `C3ThemeProvider tokens={desktopTokens('mac')}`.
   */
  desktop?: DesktopOptions;
  /** Conteúdo; sem isso, renderiza a rota filha (`<Outlet />`). */
  children?: ReactNode;
}

/** Largura máxima do conteúdo com a preferência `container` ligada. */
export const CONTAINER_WIDTH = 1440;

/**
 * Estrutura das telas: header, menu (lateral ou em barra, conforme a preferência), conteúdo e rodapé.
 * No celular o menu vira gaveta temporária.
 */
export default function AppLayout({
  menu,
  header,
  footer,
  drawerFooter,
  user,
  userPlacement = 'header',
  breadcrumbs = true,
  documentTitle = true,
  desktop: desktopOptions,
  children
}: AppLayoutProps) {
  const { config, setConfig } = useUiConfig();
  const { homePath } = useBranding();
  // no celular o header tem muitos botões; a marca vira só o símbolo para não encavalar
  const narrow = useMediaQuery((t: Theme) => t.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  // alguma página pediu altura cheia (FillHeight): a janela não rola, o conteúdo ocupa o que sobra
  const [fill, setFill] = useState(false);
  const t = useUiText();
  const location = useLocation();
  const theme = useTheme();
  const headerHeight = useHeaderHeight();
  // `desktop` = menu fixo (e não gaveta): no site a partir do `lg`; no app de desktop a partir do `drawerFrom`
  const { app, pinned: desktop } = useAppFrame(desktopOptions);
  const sidebarOpacity = app?.sidebarOpacity ?? null;
  const translucent = sidebarOpacity !== null;

  // em bloco: no Chromium novo scrollTo devolve uma Promise, e o React a chamaria como limpeza do efeito
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const horizontal = desktop && config.menuOrientation === 'horizontal';
  const rail = config.menuOrientation === 'rail';
  const tinted = config.look === 'angle';
  const mini = desktop && !horizontal && config.miniDrawer;
  const width = horizontal ? 0 : mini ? MINI_DRAWER_WIDTH : DRAWER_WIDTH;
  const userInDrawer = Boolean(user) && userPlacement === 'drawer' && !horizontal;
  // sem menu fixo à esquerda, o cabeçalho encosta no canto dos botões da janela do Mac
  const headerAtLeft = horizontal || !desktop;
  const sidebarBg = sidebarOpacity !== null ? translucentSidebarSx(theme, sidebarOpacity) : {};

  // menu mal montado (nível demais, nome repetido, grupo de um filho só) avisa no console em desenvolvimento
  useEffect(() => warnNav(menu), [menu]);
  useDocumentTitle(menu, documentTitle);

  const toggle = () => (desktop ? setConfig({ miniDrawer: !config.miniDrawer }) : setMobileOpen((o) => !o));

  const drawerContent = (
    <Stack sx={{ height: '100%' }}>
      <DrawerBrand height={headerHeight} compact={mini} desktop={app} />
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <VerticalNav mini={mini} onNavigate={() => setMobileOpen(false)} onExpand={() => setConfig({ miniDrawer: false })} />
      </Box>
      {drawerFooter && !mini && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>{drawerFooter}</Box>
        </>
      )}
      {userInDrawer && (
        <>
          {!(drawerFooter && !mini) && <Divider />}
          <Box sx={{ p: mini ? 1.5 : 1 }}>
            <UserMenu {...user!} placement={mini ? 'drawer-mini' : 'drawer'} />
          </Box>
        </>
      )}
    </Stack>
  );

  return (
    <NavContext.Provider value={menu}>
      <FillContext.Provider value={setFill}>
        {/* a janela (vibrancy) aparece onde a página não pinta: só o conteúdo tem fundo */}
        {translucent && <GlobalStyles styles={{ 'html, body': { background: 'transparent' } }} />}
        <Box
          sx={{
            display: 'flex',
            bgcolor: translucent ? 'transparent' : 'background.default',
            ...(fill ? { height: 'var(--c3-shell-height, 100dvh)', overflow: 'hidden' } : { minHeight: 'var(--c3-shell-height, 100vh)' }),
            // no papel sai só o conteúdo: menu, cabeçalho, breadcrumb e rodapé ficam na tela
            '@media print': {
              display: 'block',
              height: 'auto',
              overflow: 'visible',
              bgcolor: 'common.white',
              '& > :not([data-print-main]), & header.MuiAppBar-root, & footer, & nav.MuiBreadcrumbs-root': { display: 'none !important' },
              '& main': { p: 0, maxWidth: 'none' }
            }
          }}
        >
          {rail && (
            <RailDrawer
              desktop={desktop}
              mini={config.miniDrawer}
              mobileOpen={mobileOpen}
              onMobileClose={() => setMobileOpen(false)}
              headerHeight={headerHeight}
              app={app}
              railFooter={userInDrawer && <UserMenu {...user!} placement="drawer-mini" />}
              panelFooter={drawerFooter}
            />
          )}
          {!horizontal && !rail && (
            <Box component="aside" sx={{ width: desktop ? width : 0, flexShrink: 0, transition: 'width .2s' }}>
              {desktop ? (
                <Drawer
                  variant="permanent"
                  slotProps={{
                    paper: { sx: { width, transition: 'width .2s', overflowX: 'hidden', borderRightColor: 'divider', ...sidebarBg } }
                  }}
                >
                  {drawerContent}
                </Drawer>
              ) : (
                <Drawer
                  variant="temporary"
                  open={mobileOpen}
                  onClose={() => setMobileOpen(false)}
                  ModalProps={{ keepMounted: true }}
                  slotProps={{ paper: { sx: { width: DRAWER_WIDTH } } }}
                >
                  {drawerContent}
                </Drawer>
              )}
            </Box>
          )}

          {/* coluna do conteúdo: a única que vai ao papel (menus e diálogos ficam fora dela) */}
          <Box data-print-main sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <AppBar
              position="sticky"
              color="inherit"
              elevation={0}
              sx={[
                {
                  bgcolor: translucent ? seeThrough(theme.vars.palette.header.bg, HEADER_OPACITY) : 'header.bg',
                  color: 'header.fg',
                  borderBottom: 1,
                  borderColor: 'divider',
                  backdropFilter: 'blur(8px)',
                  // barra colorida (visual Angle): ícones e logo na cor do texto da barra
                  ...(tinted && { borderColor: 'transparent', '& .MuiIconButton-root, & .MuiButton-colorSecondary': { color: 'inherit' } })
                },
                app ? dragRegionSx : {}
              ]}
            >
              <Toolbar
                sx={[
                  { minHeight: { xs: headerHeight }, gap: 1.5, px: { xs: 2, sm: 3 } },
                  controlsInset(app?.controls ?? null, 'right'),
                  headerAtLeft ? controlsInset(app?.controls ?? null, 'left') : {}
                ]}
              >
                {horizontal ? (
                  <Box component={RouterLink} to={homePath} sx={{ color: 'inherit', textDecoration: 'none', mr: 2 }}>
                    <Logo />
                  </Box>
                ) : (
                  <>
                    <IconButton aria-label={t('c3.menu.toggle')} onClick={toggle} edge="start">
                      <HamburgerMenu size={20} />
                    </IconButton>
                    {!desktop && (
                      <Box component={RouterLink} to={homePath} sx={{ color: 'inherit', textDecoration: 'none', minWidth: 0 }}>
                        <Logo compact={narrow} />
                      </Box>
                    )}
                  </>
                )}
                <Stack direction="row" spacing={1} sx={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', minWidth: 0 }}>
                  {header}
                  {user && !userInDrawer && <UserMenu {...user} />}
                </Stack>
              </Toolbar>
              {horizontal && (
                <>
                  <Divider />
                  <HorizontalNav />
                </>
              )}
            </AppBar>

            <Box
              component="main"
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                px: { xs: 2, sm: 3 },
                pt: 3,
                width: '100%',
                maxWidth: config.container ? CONTAINER_WIDTH : 'none',
                mx: 'auto',
                minHeight: 0,
                // translúcido: o fundo sai da raiz e vem para o conteúdo, de ponta a ponta mesmo com largura máxima
                ...(translucent && {
                  bgcolor: 'background.default',
                  boxShadow: `0 0 0 100vmax ${theme.vars.palette.background.default}`,
                  clipPath: 'inset(0 -100vmax)'
                })
              }}
            >
              {breadcrumbs && <Breadcrumbs />}
              <Box sx={{ flex: 1, ...(fill && { minHeight: 0, display: 'flex', flexDirection: 'column', pb: 2 }) }}>
                {children ?? <Outlet />}
              </Box>
              {footer}
            </Box>
          </Box>
        </Box>
      </FillContext.Provider>
    </NavContext.Provider>
  );
}
