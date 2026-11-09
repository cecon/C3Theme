import { MouseEvent } from 'react';

// material-ui
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { More } from 'iconsax-reactjs';

import SoftAvatar from '../components/SoftAvatar';

/** Onde o usuário aparece: avatar no header, cartão no pé do menu lateral ou só o avatar no menu recolhido. */
export type UserMenuPlacement = 'header' | 'drawer' | 'drawer-mini';

interface TriggerProps {
  placement: UserMenuPlacement;
  name: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  label: string;
  open: boolean;
  onOpen: (e: MouseEvent<HTMLElement>) => void;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

/** O botão que abre o menu de conta, no formato de cada lugar. */
export default function UserMenuTrigger({ placement, name, email, role, avatarUrl, label, open, onOpen }: TriggerProps) {
  // as iniciais são enfeite: o nome vem do texto visível ou do aria-label
  const avatar = (
    <SoftAvatar size="sm" src={avatarUrl} alt="" aria-hidden>
      {initials(name)}
    </SoftAvatar>
  );
  // com nome visível, o nome acessível é o próprio texto (regra label-content-name-mismatch); só o avatar leva "Conta: nome"
  const textVisible = placement === 'drawer' || (placement === 'header' && Boolean(role));
  const a11y = {
    'aria-label': textVisible ? undefined : `${label}: ${name}`,
    'aria-haspopup': 'menu' as const,
    'aria-expanded': open,
    onClick: onOpen
  };

  if (placement === 'drawer-mini') {
    return (
      <Tooltip title={name} placement="right">
        <ButtonBase {...a11y} sx={{ borderRadius: '50%', mx: 'auto', display: 'flex' }}>
          {avatar}
        </ButtonBase>
      </Tooltip>
    );
  }

  if (placement === 'drawer') {
    const detail = email ?? role;
    return (
      <ButtonBase
        {...a11y}
        sx={{
          width: '100%',
          gap: 1.5,
          p: 1,
          borderRadius: 2,
          justifyContent: 'flex-start',
          textAlign: 'start',
          '&:hover, &[aria-expanded="true"]': { bgcolor: 'action.hover' }
        }}
      >
        {avatar}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {name}
          </Typography>
          {detail && (
            <Typography variant="caption" color="text.secondary" noWrap component="div">
              {detail}
            </Typography>
          )}
        </Box>
        <Box component={More} size={18} aria-hidden sx={{ color: 'text.secondary', flexShrink: 0 }} />
      </ButtonBase>
    );
  }

  return (
    <ButtonBase {...a11y} sx={{ borderRadius: 2, p: 0.5, gap: 1, textAlign: 'start' }}>
      {avatar}
      {role && (
        <Box sx={{ display: { xs: 'none', md: 'block' }, pr: 0.5 }}>
          <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
            {name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {role}
          </Typography>
        </Box>
      )}
    </ButtonBase>
  );
}
