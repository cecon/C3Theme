import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { Call, InfoCircle, Messages3, More, NotificationBing, Trash, Video } from 'iconsax-reactjs';

import { notify } from '@c3theme/ui';
import { Contact, PRESENCE } from './data';
import StatusAvatar from './StatusAvatar';

interface ChatHeaderProps {
  contact: Contact;
  typing: boolean;
  showMenuButton: boolean;
  detailsOpen: boolean;
  onOpenList: () => void;
  onToggleDetails: () => void;
  onClear: () => void;
}

function statusLine(contact: Contact, typing: boolean) {
  if (typing) return 'digitando…';
  if (contact.presence === 'offline' && contact.lastSeen) return `Visto por último ${contact.lastSeen}`;
  return PRESENCE[contact.presence].label;
}

/** Topo da conversa: contato, presença e ações. */
export default function ChatHeader({
  contact,
  typing,
  showMenuButton,
  detailsOpen,
  onOpenList,
  onToggleDetails,
  onClear
}: ChatHeaderProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: { xs: 1.5, sm: 2.5 }, py: 1.5, minHeight: 72 }}>
      {showMenuButton && (
        <IconButton aria-label="Abrir conversas" onClick={onOpenList} edge="start">
          <Messages3 size={20} />
        </IconButton>
      )}
      <StatusAvatar name={contact.name} tone={contact.tone} presence={contact.presence} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="subtitle1" noWrap>
          {contact.name}
        </Typography>
        <Typography variant="caption" noWrap component="p" color={typing ? 'primary.main' : 'text.secondary'}>
          {statusLine(contact, typing)}
        </Typography>
      </Box>
      <Stack direction="row" sx={{ flexShrink: 0 }}>
        <Tooltip title="Chamada de voz">
          <IconButton aria-label="Chamada de voz" onClick={() => notify(`Ligando para ${contact.name}… (demonstração)`, 'info')}>
            <Call size={20} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Chamada de vídeo">
          <IconButton
            aria-label="Chamada de vídeo"
            onClick={() => notify(`Videochamada com ${contact.name}… (demonstração)`, 'info')}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            <Video size={20} />
          </IconButton>
        </Tooltip>
        <Tooltip title={detailsOpen ? 'Ocultar detalhes' : 'Detalhes do contato'}>
          <IconButton
            aria-label="Detalhes do contato"
            aria-pressed={detailsOpen}
            onClick={onToggleDetails}
            color={detailsOpen ? 'primary' : 'default'}
          >
            <InfoCircle size={20} variant={detailsOpen ? 'Bold' : 'Linear'} />
          </IconButton>
        </Tooltip>
        <IconButton aria-label="Mais opções" aria-haspopup="menu" onClick={(e) => setAnchor(e.currentTarget)}>
          <More size={20} style={{ transform: 'rotate(90deg)' }} />
        </IconButton>
      </Stack>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null);
            notify(`Notificações de ${contact.name} silenciadas.`, 'info');
          }}
        >
          <ListItemIcon>
            <NotificationBing size={18} />
          </ListItemIcon>
          Silenciar notificações
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onClear();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <Trash size={18} />
          </ListItemIcon>
          Limpar conversa
        </MenuItem>
      </Menu>
    </Stack>
  );
}
