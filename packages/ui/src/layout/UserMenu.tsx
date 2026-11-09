import { ElementType, ReactNode, useState } from 'react';
import { Link as RouterLink } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Logout } from 'iconsax-reactjs';

import SoftAvatar from '../components/SoftAvatar';
import { useUiText } from '../i18n';
import UserMenuTrigger, { initials, UserMenuPlacement } from './UserMenuTrigger';

export interface UserMenuItem {
  label: string;
  icon?: ElementType;
  to?: string;
  onClick?: () => void;
}

export interface UserMenuProps {
  name: string;
  email?: string;
  /** Cargo ou perfil, mostrado ao lado do nome em telas largas. */
  role?: string;
  avatarUrl?: string;
  items?: UserMenuItem[];
  onLogout?: () => void;
  /** Conteúdo extra no fim do menu. */
  footer?: ReactNode;
  /** `header` (padrão): avatar no cabeçalho; `drawer`: cartão no pé do menu lateral; `drawer-mini`: só o avatar. */
  placement?: UserMenuPlacement;
}

/** Avatar do usuário com menu de conta (perfil, configurações, sair): no header ou no pé do menu lateral. */
export default function UserMenu({ name, email, role, avatarUrl, items = [], onLogout, footer, placement = 'header' }: UserMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const t = useUiText();
  const close = () => setAnchor(null);
  const inDrawer = placement !== 'header';

  return (
    <>
      <UserMenuTrigger
        placement={placement}
        name={name}
        email={email}
        role={role}
        avatarUrl={avatarUrl}
        label={t('c3.account')}
        open={anchor !== null}
        onOpen={(e) => setAnchor(e.currentTarget)}
      />
      <Menu
        anchorEl={anchor}
        open={anchor !== null}
        onClose={close}
        // no pé do menu lateral abre para cima e para o lado do conteúdo
        anchorOrigin={
          inDrawer
            ? { vertical: 'top', horizontal: placement === 'drawer' ? 'left' : 'right' }
            : { vertical: 'bottom', horizontal: 'right' }
        }
        transformOrigin={inDrawer ? { vertical: 'bottom', horizontal: 'left' } : { vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 240, ...(inDrawer ? { mb: 0.5 } : { mt: 0.5 }) } } }}
      >
        {/* o cartão do menu lateral já mostra nome e e-mail */}
        {placement !== 'drawer' && [
          <Stack key="who" direction="row" spacing={1.5} sx={{ px: 2, py: 1.25, alignItems: 'center' }}>
            <SoftAvatar src={avatarUrl} alt={name}>
              {initials(name)}
            </SoftAvatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {name}
              </Typography>
              {email && (
                <Typography variant="caption" color="text.secondary" noWrap component="div">
                  {email}
                </Typography>
              )}
            </Box>
          </Stack>,
          <Divider key="sep" />
        ]}
        {items.map(({ label, icon: Icon, to, onClick }) => (
          <MenuItem
            key={label}
            {...(to ? { component: RouterLink, to } : {})}
            onClick={() => {
              close();
              onClick?.();
            }}
          >
            {Icon && (
              <ListItemIcon>
                <Icon size={18} />
              </ListItemIcon>
            )}
            {label}
          </MenuItem>
        ))}
        {onLogout && items.length > 0 && <Divider />}
        {onLogout && (
          <MenuItem
            onClick={() => {
              close();
              onLogout();
            }}
          >
            <ListItemIcon>
              <Logout size={18} />
            </ListItemIcon>
            {t('c3.logout')}
          </MenuItem>
        )}
        {footer}
      </Menu>
    </>
  );
}
