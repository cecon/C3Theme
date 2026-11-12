import { useState, type KeyboardEvent, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// third-party
import { Edit2, Routing2, Send2, Timer1, Trash } from 'iconsax-reactjs';

import type { Message } from '../core/types';
import type { QueuedMessage } from '../hooks/useMessageQueue';
import { useChatText } from './text';

export interface QueuedMessagesProps {
  items: QueuedMessage[];
  onUpdate: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  /** Mandar já. Sem isso (assistente respondendo), o botão some. */
  onSendNow?: (id: string) => void;
  /** Orientar o turno em andamento com a mensagem (ADR 0008). Sem isso, o botão some. */
  onSteer?: (id: string) => void;
  /** Orientações que o agente ainda não leu (`steer: 'pending'`): "Orientando", só com Remover. */
  steering?: Message[];
  /** Remover uma orientação que espera. Sem isso, ela só mostra o estado. */
  onRemoveSteering?: (id: string) => void;
}

type RowProps = Omit<QueuedMessagesProps, 'items' | 'steering' | 'onRemoveSteering'> & { item: QueuedMessage };

const rowSx = { alignItems: 'center', px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'action.hover', minHeight: 40 } as const;

function Action({ label, icon, onClick }: { label: string; icon: ReactNode; onClick: () => void }) {
  return (
    <Tooltip title={label}>
      <IconButton size="small" aria-label={label} onClick={onClick} sx={{ color: 'text.secondary' }}>
        {icon}
      </IconButton>
    </Tooltip>
  );
}

function Label({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <>
      <Box component="span" aria-hidden sx={{ display: 'inline-flex', color: 'text.secondary', flexShrink: 0 }}>
        {icon}
      </Box>
      <Typography variant="body2" component="span" sx={{ fontWeight: 600, flexShrink: 0 }}>
        {text}
      </Typography>
    </>
  );
}

/** Orientação esperando o agente ler: o estado e, com `onRemove`, só o Remover. */
function SteeringRow({ message, onRemove }: { message: Message; onRemove?: (id: string) => void }) {
  const t = useChatText();
  return (
    <Stack component="li" direction="row" spacing={1} sx={rowSx}>
      <Label icon={<Routing2 size={16} />} text={t('c3.chat.steering')} />
      <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0, color: 'text.secondary' }} title={message.text}>
        {message.text}
      </Typography>
      {onRemove && <Action label={t('c3.chat.removeSteer')} icon={<Trash size={16} />} onClick={() => onRemove(message.id)} />}
    </Stack>
  );
}

function Row({ item, onUpdate, onRemove, onSendNow, onSteer }: RowProps) {
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

  return (
    <Stack component="li" direction="row" spacing={1} sx={rowSx}>
      <Label icon={<Timer1 size={16} />} text={t('c3.chat.queued')} />
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
          <Action label={t('c3.chat.editQueued')} icon={<Edit2 size={16} />} onClick={() => setEditing(item.text)} />
          {onSteer && <Action label={t('c3.chat.steer')} icon={<Routing2 size={16} />} onClick={() => onSteer(item.id)} />}
          {onSendNow && <Action label={t('c3.chat.sendNow')} icon={<Send2 size={16} />} onClick={() => onSendNow(item.id)} />}
          <Action label={t('c3.chat.removeQueued')} icon={<Trash size={16} />} onClick={() => onRemove(item.id)} />
        </>
      )}
    </Stack>
  );
}

/**
 * Mensagens na fila, acima da caixa: escritas enquanto o assistente respondia, saem sozinhas quando ele termina.
 * Editar (Enter salva, Esc desiste), orientar o turno em andamento, mandar já (com o assistente parado) ou tirar da
 * fila. Em cima, as orientações que o agente ainda não leu ("Orientando", só com Remover).
 */
export default function QueuedMessages({ items, steering = [], onRemoveSteering, ...rest }: QueuedMessagesProps) {
  const t = useChatText();
  if (!items.length && !steering.length) return null;
  return (
    <Stack component="ul" spacing={0.75} aria-label={t('c3.chat.queue')} sx={{ listStyle: 'none', m: 0, p: 0, mb: 1 }}>
      {steering.map((m) => (
        <SteeringRow key={m.id} message={m} onRemove={onRemoveSteering} />
      ))}
      {items.map((item) => (
        <Row key={item.id} item={item} {...rest} />
      ))}
    </Stack>
  );
}
