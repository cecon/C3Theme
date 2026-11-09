import type { ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Paperclip, VolumeSlash } from 'iconsax-reactjs';

import { EmptyState, SoftAvatar } from '@c3theme/ui';
import type { Conversation } from '../core/types';
import { useDayFormat } from './format';
import { useChatText } from './text';

export interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  /** Avatar de cada conversa. Padrão: iniciais do título. */
  renderAvatar?: (c: Conversation) => ReactNode;
  /** Algo à direita da linha, abaixo da hora (etiqueta, canal, SLA). */
  renderExtra?: (c: Conversation) => ReactNode;
  /** Lista vazia. Padrão: "Nenhuma conversa". */
  empty?: ReactNode;
}

export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

/** Conversas com a última mensagem, hora e não lidas. Busca e filtros ficam com o app, por fora. */
export default function ConversationList({ conversations, selectedId, onSelect, renderAvatar, renderExtra, empty }: ConversationListProps) {
  const t = useChatText();
  const day = useDayFormat();

  if (conversations.length === 0) return <>{empty ?? <EmptyState dense title={t('c3.chat.noConversations')} />}</>;

  return (
    <List aria-label={t('c3.chat.conversations')} sx={{ py: 0 }}>
      {conversations.map((c) => {
        const last = c.lastMessage;
        const body = last?.text || (last?.attachments?.length ? last.attachments[0].name || t('c3.chat.attachment') : '');
        const unread = c.unread > 0;
        return (
          <ListItem key={c.id} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              selected={c.id === selectedId}
              aria-current={c.id === selectedId ? 'true' : undefined}
              onClick={() => onSelect(c.id)}
              sx={{ gap: 1.5, py: 1.25, alignItems: 'flex-start' }}
            >
              {renderAvatar ? renderAvatar(c) : <SoftAvatar src={c.avatarUrl}>{initials(c.title)}</SoftAvatar>}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                  <Typography variant="subtitle2" noWrap sx={{ flex: 1, fontWeight: unread ? 700 : 600 }}>
                    {c.title}
                  </Typography>
                  {last && (
                    <Typography variant="caption" color={unread ? 'primary.main' : 'text.secondary'} sx={{ flexShrink: 0 }}>
                      {day.short(last.createdAt)}
                    </Typography>
                  )}
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.25 }}>
                  <Typography variant="body2" color={unread ? 'text.primary' : 'text.secondary'} noWrap sx={{ flex: 1 }}>
                    {last?.direction === 'out' && `${t('c3.chat.you')}: `}
                    {!last?.text && last?.attachments?.length ? (
                      <Paperclip size={14} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} />
                    ) : null}
                    {body || c.subtitle}
                  </Typography>
                  {c.muted && <VolumeSlash size={14} aria-label={t('c3.chat.muted')} />}
                  {unread && (
                    <Box
                      aria-label={t('c3.chat.unread', { count: c.unread })}
                      sx={{
                        minWidth: 20,
                        height: 20,
                        px: 0.75,
                        borderRadius: 10,
                        bgcolor: c.muted ? 'action.disabled' : 'primary.main',
                        color: 'primary.contrastText',
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {c.unread > 99 ? '99+' : c.unread}
                    </Box>
                  )}
                </Stack>
                {renderExtra?.(c)}
              </Box>
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}
