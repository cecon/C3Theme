import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import DrawerBrand from './DrawerBrand';
import VerticalNav from './VerticalNav';
import UserMenu, { type UserMenuProps } from './UserMenu';
import type { ResolvedDesktop } from './desktop';
export default function DefaultDrawerContent({
  headerHeight,
  mini,
  app,
  drawerFooter,
  userInDrawer,
  user,
  onNavigate,
  onExpand
}: {
  headerHeight: number;
  mini: boolean;
  app: ResolvedDesktop | null;
  drawerFooter?: ReactNode;
  userInDrawer: boolean;
  user?: Omit<UserMenuProps, 'placement'>;
  onNavigate: () => void;
  onExpand: () => void;
}) {
  return (
    <Stack sx={{ height: '100%' }}>
      <DrawerBrand height={headerHeight} compact={mini} desktop={app} />
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <VerticalNav mini={mini} onNavigate={onNavigate} onExpand={onExpand} />
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
}
