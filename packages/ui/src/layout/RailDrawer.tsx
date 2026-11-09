import { ReactNode, useRef, useState } from 'react';
import { useLocation } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';

import { translucentSidebarSx, type ResolvedDesktop } from './desktop';
import DrawerBrand from './DrawerBrand';
import { activeItemId, containsId, NavItem, useNav } from './nav';
import RailNav, { RAIL_WIDTH } from './RailNav';
import RailPanel, { PANEL_WIDTH } from './RailPanel';

interface RailDrawerProps {
  desktop: boolean;
  /** Recolhido: só o trilho; o painel abre flutuando ao clicar no módulo e fecha ao escolher a tela. */
  mini: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  headerHeight: number;
  /** Pé do trilho (avatar do usuário). */
  railFooter?: ReactNode;
  /** Pé do painel (some com o painel). */
  panelFooter?: ReactNode;
  /** App de desktop: topo do trilho arrasta a janela e foge dos botões dela; menu translúcido. */
  app?: ResolvedDesktop | null;
}

/**
 * Menu em dois níveis: trilho de módulos + painel com as telas do módulo. Fixo, o painel mostra o módulo
 * da tela atual (ou o último aberto) e clicar de novo no módulo o fecha. No celular, trilho e painel vão
 * juntos na gaveta.
 */
export default function RailDrawer(props: RailDrawerProps) {
  const { desktop, mini, mobileOpen, onMobileClose, headerHeight, railFooter, panelFooter, app = null } = props;
  const groups = useNav();
  const { pathname, search } = useLocation();
  const theme = useTheme();
  const opacity = app?.sidebarOpacity ?? null;
  const active = activeItemId(groups, pathname, search);
  const modules = groups.flatMap((g) => g.items).filter((i) => i.children?.length);
  const holder = modules.find((m) => containsId(m, active))?.id;
  const floating = desktop && mini;
  const railRef = useRef<HTMLDivElement>(null);

  const [chosen, setChosen] = useState<string | undefined>(floating ? undefined : (holder ?? (desktop ? undefined : modules[0]?.id)));
  // a tela mudou (link, busca, voltar): o painel fixo acompanha o módulo dela; o flutuante fecha
  const [seen, setSeen] = useState(active);
  if (seen !== active) {
    setSeen(active);
    if (floating) setChosen(undefined);
    else if (holder) setChosen(holder);
  }

  const module: NavItem | undefined = modules.find((m) => m.id === chosen);
  const toggle = (id: string) => setChosen((c) => (c === id && (desktop || floating) ? undefined : id));
  const navigate = () => {
    if (!desktop) onMobileClose();
    if (floating) setChosen(undefined);
  };

  const rail = (
    <Stack
      ref={railRef}
      sx={{ width: RAIL_WIDTH, height: '100%', flexShrink: 0, borderRight: module && !floating ? 1 : 0, borderColor: 'divider' }}
    >
      <DrawerBrand height={headerHeight} compact desktop={app} />
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <RailNav groups={groups} active={active} open={chosen} onOpen={toggle} onNavigate={navigate} />
      </Box>
      {railFooter && <Box sx={{ p: 1.5, display: 'grid', placeItems: 'center' }}>{railFooter}</Box>}
    </Stack>
  );

  const panel = module && (
    <Stack sx={{ width: PANEL_WIDTH, height: '100%', flexShrink: 0 }}>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <RailPanel module={module} active={active} headerHeight={headerHeight} onNavigate={navigate} drag={Boolean(app)} />
      </Box>
      {panelFooter && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>{panelFooter}</Box>
        </>
      )}
    </Stack>
  );

  if (!desktop)
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        slotProps={{ paper: { sx: { flexDirection: 'row', maxWidth: '88vw' } } }}
      >
        {rail}
        {panel}
      </Drawer>
    );

  const width = RAIL_WIDTH + (module && !floating ? PANEL_WIDTH : 0);
  return (
    <Box component="aside" sx={{ width, flexShrink: 0, transition: 'width .2s' }}>
      <Drawer
        variant="permanent"
        slotProps={{
          paper: {
            sx: {
              width,
              flexDirection: 'row',
              overflowX: 'hidden',
              transition: 'width .2s',
              borderRightColor: 'divider',
              ...(opacity !== null && translucentSidebarSx(theme, opacity))
            }
          }
        }}
      >
        {rail}
        {!floating && panel}
      </Drawer>
      {floating && panel && (
        <ClickAwayListener
          // clique no trilho é tratado pelo próprio módulo (trocar ou fechar o painel)
          onClickAway={(e) => !railRef.current?.contains(e.target as Node) && setChosen(undefined)}
        >
          <Paper
            elevation={8}
            square
            onKeyDown={(e) => e.key === 'Escape' && setChosen(undefined)}
            sx={{
              position: 'fixed',
              top: 0,
              bottom: 0,
              left: RAIL_WIDTH,
              zIndex: (t) => t.zIndex.drawer + 1,
              borderRight: 1,
              borderColor: 'divider'
            }}
          >
            {panel}
          </Paper>
        </ClickAwayListener>
      )}
    </Box>
  );
}
