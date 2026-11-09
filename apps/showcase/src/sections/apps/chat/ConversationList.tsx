import { useState, type MouseEvent } from 'react';

// material-ui
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowDown2, SearchNormal1 } from 'iconsax-reactjs';

import { ConversationList as C3ConversationList, type Conversation } from '@c3theme/chat';
import { Dot } from '@c3theme/ui';
import { CONTACTS, ME, PRESENCE, Presence } from './data';
import StatusAvatar from './StatusAvatar';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string;
  myPresence: Presence;
  onPresence: (p: Presence) => void;
  onSelect: (id: string) => void;
}

/** Coluna de conversas: meu status e busca (da vitrine) por cima da lista do @c3theme/chat. */
export default function ConversationList({ conversations, activeId, myPresence, onPresence, onSelect }: ConversationListProps) {
  const [query, setQuery] = useState('');
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = conversations.filter((c) => !q || c.title.toLowerCase().includes(q) || c.subtitle?.toLowerCase().includes(q));
  const contactOf = (id: string) => CONTACTS.find((c) => c.id === id)!;

  return (
    <Stack sx={{ height: '100%', minHeight: 0 }}>
      <Box sx={{ p: 2, pb: 1.5 }}>
        <ButtonBase
          onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}
          aria-label="Alterar meu status"
          aria-haspopup="menu"
          sx={{ width: '100%', justifyContent: 'flex-start', gap: 1.5, borderRadius: 2, p: 0.5, textAlign: 'start' }}
        >
          <StatusAvatar name={ME.name} tone={ME.tone} presence={myPresence} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" noWrap>
              {ME.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {PRESENCE[myPresence].label}
            </Typography>
          </Box>
          <ArrowDown2 size={16} />
        </ButtonBase>
        <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
          {(Object.keys(PRESENCE) as Presence[]).map((p) => (
            <MenuItem
              key={p}
              selected={p === myPresence}
              onClick={() => {
                onPresence(p);
                setAnchor(null);
              }}
            >
              <ListItemIcon>
                <Dot tone={PRESENCE[p].tone} size={10} />
              </ListItemIcon>
              {PRESENCE[p].label}
            </MenuItem>
          ))}
        </Menu>

        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar conversa"
          size="small"
          fullWidth
          sx={{ mt: 2 }}
          slotProps={{
            htmlInput: { 'aria-label': 'Buscar conversa' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchNormal1 size={16} />
                </InputAdornment>
              )
            }
          }}
        />
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflowY: 'auto', p: 1, '& .MuiListItemButton-root': { borderRadius: 2, mb: 0.25 } }}>
        <C3ConversationList
          conversations={filtered}
          selectedId={activeId}
          onSelect={onSelect}
          renderAvatar={(c) => {
            const contact = contactOf(c.id);
            return <StatusAvatar name={contact.name} tone={contact.tone} presence={contact.presence} />;
          }}
          empty={
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              Nenhum contato encontrado.
            </Typography>
          }
        />
      </Box>
    </Stack>
  );
}
