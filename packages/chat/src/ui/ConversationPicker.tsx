// material-ui
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { MessageAdd1, Trash } from 'iconsax-reactjs';

import type { Conversation } from '../core/types';
import { useDayFormat } from './format';
import { useChatText } from './text';

export interface ConversationPickerProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  /** Botão "Nova conversa". Sem isso, não aparece. */
  onNew?: () => void;
  /** Botão de apagar a conversa escolhida. Quem pergunta "tem certeza?" é quem chama (o AssistantPanel pergunta). */
  onDelete?: (id: string) => void;
}

/**
 * Troca de conversa em pouco espaço (painel lateral do assistente): uma caixa de escolha com o histórico, mais
 * nova conversa e apagar. Em tela larga, prefira a `ConversationList`.
 */
export default function ConversationPicker({ conversations, selectedId, onSelect, onNew, onDelete }: ConversationPickerProps) {
  const t = useChatText();
  const day = useDayFormat();
  const selected = conversations.some((c) => c.id === selectedId) ? selectedId : '';

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      <TextField
        select
        size="small"
        fullWidth
        label={t('c3.chat.conversation')}
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        disabled={conversations.length === 0}
        slotProps={{
          select: {
            renderValue: (id) => conversations.find((c) => c.id === id)?.title ?? '',
            MenuProps: { slotProps: { paper: { sx: { maxHeight: 360 } } } }
          }
        }}
      >
        {conversations.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            <ListItemText
              primary={c.title}
              secondary={c.updatedAt ? day.short(c.updatedAt) : undefined}
              slotProps={{ primary: { noWrap: true, variant: 'body2' }, secondary: { variant: 'caption' } }}
              sx={{ my: 0, minWidth: 0 }}
            />
          </MenuItem>
        ))}
      </TextField>
      {onNew && (
        <Tooltip title={t('c3.chat.newConversation')}>
          <IconButton aria-label={t('c3.chat.newConversation')} onClick={onNew}>
            <MessageAdd1 size={20} />
          </IconButton>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip title={t('c3.chat.deleteConversation')}>
          <span>
            <IconButton aria-label={t('c3.chat.deleteConversation')} onClick={() => selected && onDelete(selected)} disabled={!selected}>
              <Trash size={20} />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Stack>
  );
}
