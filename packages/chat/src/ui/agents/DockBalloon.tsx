import { useState, type FormEvent, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { CloseCircle, Messages2, Send2 } from 'iconsax-reactjs';

import type { AgentState } from '../../core/agents';
import type { Message } from '../../core/types';
import MessageBubble from '../MessageBubble';
import { useChatText } from '../text';
import { fillAvatar } from './fill';

export interface DockBalloonProps {
  id: string;
  name: string;
  state: AgentState;
  avatar?: ReactNode;
  /** Últimas mensagens da conversa com o agente; o balão mostra as `limit` mais recentes. */
  messages: Message[];
  limit?: number;
  onReply: (text: string) => void;
  onOpen: () => void;
  onClose: () => void;
  width?: number;
}

/** Balão ao lado do item da doca: últimas mensagens, resposta rápida e "Abrir conversa". */
export default function DockBalloon({
  id,
  name,
  state,
  avatar,
  messages,
  limit = 3,
  onReply,
  onOpen,
  onClose,
  width = 320
}: DockBalloonProps) {
  const t = useChatText();
  const [text, setText] = useState('');
  const recent = messages.slice(-limit);
  const send = (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    onReply(value);
    setText('');
  };

  return (
    <Paper
      id={id}
      role="dialog"
      aria-label={name}
      elevation={8}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      sx={{ width, maxWidth: 'calc(100vw - 96px)', borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider' }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        {avatar && (
          <Box aria-hidden sx={fillAvatar(28)}>
            {avatar}
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {name}
          </Typography>
          <Typography variant="caption" color="text.secondary" component="p">
            {t(`c3.chat.agent.${state}`)}
          </Typography>
        </Box>
        <IconButton size="small" aria-label={t('c3.chat.close')} onClick={onClose}>
          <CloseCircle size={18} />
        </IconButton>
      </Stack>

      <Stack
        spacing={0.75}
        role="log"
        tabIndex={0}
        aria-label={t('c3.chat.recent', { name })}
        sx={{ px: 1.5, py: 1.25, maxHeight: 260, overflowY: 'auto' }}
      >
        {recent.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('c3.chat.empty')}
          </Typography>
        ) : (
          recent.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </Stack>

      <Box component="form" onSubmit={send} sx={{ display: 'flex', gap: 0.5, alignItems: 'center', px: 1.5, pb: 1 }}>
        <TextField
          size="small"
          fullWidth
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('c3.chat.replyTo', { name })}
          slotProps={{ htmlInput: { 'aria-label': t('c3.chat.replyTo', { name }) } }}
        />
        <IconButton type="submit" color="primary" aria-label={t('c3.chat.send')} disabled={!text.trim()}>
          <Send2 size={18} variant="Bold" />
        </IconButton>
      </Box>
      <Box sx={{ px: 1, pb: 1 }}>
        <Button fullWidth size="small" startIcon={<Messages2 size={16} />} onClick={onOpen}>
          {t('c3.chat.openConversation')}
        </Button>
      </Box>
    </Paper>
  );
}
