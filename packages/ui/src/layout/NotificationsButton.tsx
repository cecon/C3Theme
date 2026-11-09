import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router';

// material-ui
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { Notification } from 'iconsax-reactjs';

import Dot from '../components/Dot';
import SoftAvatar from '../components/SoftAvatar';
import type { Tone } from '../theme/soft';
import { useUiText } from '../i18n';

export interface NotificationItem {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Texto curto de quando aconteceu, ex.: "há 5 min". */
  time?: string;
  read?: boolean;
  icon?: ReactNode;
  tone?: Tone;
  to?: string;
}

export interface NotificationsButtonProps {
  items: NotificationItem[];
  onItemClick?: (item: NotificationItem) => void;
  onMarkAllRead?: () => void;
  /** Link "ver todas". */
  viewAllTo?: string;
  /** Não lidas segundo o servidor, quando a lista mostra só as últimas. Sem ele, conta as `items` não lidas. */
  unread?: number;
}

/** Sino do header com contador de não lidas e lista em popover. */
export default function NotificationsButton({ items, onItemClick, onMarkAllRead, viewAllTo, unread: total }: NotificationsButtonProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const navigate = useNavigate();
  const t = useUiText();
  const unread = total ?? items.filter((n) => !n.read).length;
  const close = () => setAnchor(null);

  return (
    <>
      <Tooltip title={t('c3.notifications')}>
        <IconButton
          aria-label={unread ? t('c3.notifications.unread', { count: unread }) : t('c3.notifications')}
          onClick={(e) => setAnchor(e.currentTarget)}
        >
          {/* até 99 o selo mostra o número do aria-label (leitor de tela e quem dita pela voz ouvem o mesmo) */}
          <Badge badgeContent={unread} color="error" max={99}>
            <Notification size={20} />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: { xs: 'calc(100vw - 32px)', sm: 380 }, mt: 0.5 } } }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
          <Typography variant="h5">{t('c3.notifications')}</Typography>
          {onMarkAllRead && unread > 0 && (
            <Button size="small" onClick={onMarkAllRead}>
              {t('c3.notifications.markAll')}
            </Button>
          )}
        </Stack>
        <Divider />
        {items.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
            {t('c3.notifications.empty')}
          </Typography>
        ) : (
          <List disablePadding sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {items.map((n) => (
              <ListItemButton
                key={n.id}
                onClick={() => {
                  close();
                  onItemClick?.(n);
                  if (n.to) navigate(n.to);
                }}
                sx={{ gap: 1.5, alignItems: 'flex-start', py: 1.25, borderRadius: 0 }}
              >
                <SoftAvatar size="sm" tone={n.tone ?? 'primary'}>
                  {n.icon}
                </SoftAvatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 600 }}>
                    {n.title}
                  </Typography>
                  {n.description && (
                    <Typography variant="caption" color="text.secondary" component="div">
                      {n.description}
                    </Typography>
                  )}
                  {n.time && (
                    <Typography variant="caption" color="text.secondary">
                      {n.time}
                    </Typography>
                  )}
                </Box>
                {!n.read && (
                  <Box sx={{ pt: 0.75 }}>
                    <Dot />
                  </Box>
                )}
              </ListItemButton>
            ))}
          </List>
        )}
        {viewAllTo && (
          <>
            <Divider />
            <Button
              fullWidth
              sx={{ borderRadius: 0, py: 1.25 }}
              onClick={() => {
                close();
                navigate(viewAllTo);
              }}
            >
              {t('c3.notifications.viewAll')}
            </Button>
          </>
        )}
      </Popover>
    </>
  );
}
