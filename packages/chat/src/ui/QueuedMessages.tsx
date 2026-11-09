import { useState, type KeyboardEvent, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { Edit2, Send2, Timer1, Trash } from 'iconsax-reactjs';

import type { QueuedMessage } from '../hooks/useMessageQueue';
import { useChatText } from './text';

export interface QueuedMessagesProps {
  items: QueuedMessage[];
  onUpdate: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  /** Mandar já. Sem isso (assistente respondendo), o botão some. */
  onSendNow?: (id: string) => void;
}

function Row({ item, onUpdate, onRemove, onSendNow }: Omit<QueuedMessagesProps, 'items'> & { item: QueuedMessage }) {
  const t = useChatText();
  const [editing, setEditing] = useState<string | null>(null);

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') setEditing(null);
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (editing?.trim()) onUpdate(item.id, editing.trim());
      setEditing(null);
    }
  }

  const action = (label: string, icon: ReactNode, onClick: () => void) => (
    <Tooltip title={label}>
      <IconButton size="small" aria-label={label} onClick={onClick} sx={{ color: 'text.secondary' }}>
        {icon}
      </IconButton>
    </Tooltip>
  );

  return (
    <Stack
      component="li"
      direction="row"
      spacing={1}
      sx={{ alignItems: 'center', px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'action.hover', minHeight: 40 }}
    >
      <Box component={Timer1} size={16} aria-hidden sx={{ color: 'text.secondary', flexShrink: 0 }} />
      <Typography variant="body2" component="span" sx={{ fontWeight: 600, flexShrink: 0 }}>
        {t('c3.chat.queued')}
      </Typography>
      {editing !== null ? (
        <InputBase
          autoFocus
          fullWidth
          value={editing}
          onChange={(e) => setEditing(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => setEditing(null)}
          inputProps={{ 'aria-label': t('c3.chat.editQueued') }}
          sx={{ typography: 'body2', flex: 1 }}
        />
      ) : (
        <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0, color: 'text.secondary' }} title={item.text}>
          {item.text}
          {item.files.length > 0 && ` · ${t('c3.chat.files', { count: item.files.length })}`}
        </Typography>
      )}
      {editing === null && (
        <>
          {action(t('c3.chat.editQueued'), <Edit2 size={16} />, () => setEditing(item.text))}
          {onSendNow && action(t('c3.chat.sendNow'), <Send2 size={16} />, () => onSendNow(item.id))}
          {action(t('c3.chat.removeQueued'), <Trash size={16} />, () => onRemove(item.id))}
        </>
      )}
    </Stack>
  );
}

/**
 * Mensagens na fila, acima da caixa: escritas enquanto o assistente respondia, saem sozinhas quando ele termina.
 * Editar (Enter salva, Esc desiste), mandar já (com o assistente parado) ou tirar da fila.
 */
export default function QueuedMessages({ items, ...rest }: QueuedMessagesProps) {
  const t = useChatText();
  if (!items.length) return null;
  return (
    <Stack component="ul" spacing={0.75} aria-label={t('c3.chat.queue')} sx={{ listStyle: 'none', m: 0, p: 0, mb: 1 }}>
      {items.map((item) => (
        <Row key={item.id} item={item} {...rest} />
      ))}
    </Stack>
  );
}
