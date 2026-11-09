import { useState, type FormEvent, type ReactNode } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { Danger, Messages2, Send2 } from 'iconsax-reactjs';

import { progressPercent, type AgentRequest } from '../../core/agents';
import { useChatText } from '../text';
import { fillAvatar } from './fill';

/** O que a faixa repassa para o app. O componente não chama rede: cada clique vira um destes. */
export interface RequestHandlers {
  onApprove?: (request: AgentRequest, scope: 'once' | 'always') => void;
  onDecline?: (request: AgentRequest) => void;
  onAnswer?: (request: AgentRequest, text: string) => void;
  onStop?: (request: AgentRequest) => void;
  onOpen?: (request: AgentRequest) => void;
  onDismiss?: (request: AgentRequest) => void;
}

export interface RequestCardProps extends RequestHandlers {
  request: AgentRequest;
  avatar?: ReactNode;
}

function Answer({ request, onAnswer }: { request: AgentRequest & { kind: 'question' }; onAnswer?: RequestHandlers['onAnswer'] }) {
  const t = useChatText();
  const [text, setText] = useState('');
  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAnswer?.(request, text.trim());
    setText('');
  };
  return (
    <Box component="form" onSubmit={send} sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
      <TextField
        size="small"
        fullWidth
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={request.placeholder ?? t('c3.chat.yourAnswer')}
        slotProps={{ htmlInput: { 'aria-label': t('c3.chat.yourAnswer') } }}
      />
      <IconButton type="submit" color="primary" aria-label={t('c3.chat.reply')} disabled={!text.trim()}>
        <Send2 size={18} variant="Bold" />
      </IconButton>
    </Box>
  );
}

/** Cartão de um pedido na faixa do topo: aprovação, pergunta, trabalho em andamento ou falha. */
export default function RequestCard({ request: r, avatar, ...on }: RequestCardProps) {
  const t = useChatText();
  const percent = r.kind === 'progress' ? progressPercent(r.progress) : undefined;
  const failed = r.kind === 'failure';

  return (
    <Paper
      variant="outlined"
      component="article"
      aria-label={`${r.agentName}: ${t(`c3.chat.request.${r.kind}`)}`}
      sx={{ p: 1.5, borderRadius: 2.5 }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.75 }}>
        {avatar && (
          <Box aria-hidden sx={fillAvatar(24)}>
            {avatar}
          </Box>
        )}
        <Typography variant="subtitle2" noWrap sx={{ flex: 1, minWidth: 0 }}>
          {r.agentName}
        </Typography>
        <Typography variant="caption" sx={{ color: failed ? 'error.main' : 'text.secondary', fontWeight: 600 }}>
          {t(`c3.chat.request.${r.kind}`)}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'flex-start', mb: 1.25 }}>
        {failed && <Box component={Danger} size={18} variant="Bold" aria-hidden sx={{ color: 'error.main', flexShrink: 0, mt: 0.125 }} />}
        <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
          {r.text}
        </Typography>
      </Stack>

      {r.kind === 'question' && <Answer request={r} onAnswer={on.onAnswer} />}
      {r.kind === 'progress' && (
        <LinearProgress
          variant={percent === undefined ? 'indeterminate' : 'determinate'}
          value={percent}
          aria-label={r.text}
          sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
        />
      )}

      <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', mt: 1 }}>
        {r.kind === 'approval' && (
          <>
            <Button size="small" variant="contained" onClick={() => on.onApprove?.(r, 'once')}>
              {t('c3.chat.allowOnce')}
            </Button>
            <Button size="small" variant="outlined" onClick={() => on.onApprove?.(r, 'always')}>
              {t('c3.chat.allowAlways')}
            </Button>
            <Button size="small" color="inherit" onClick={() => on.onDecline?.(r)}>
              {t('c3.chat.decline')}
            </Button>
          </>
        )}
        {r.kind === 'progress' && (
          <Button size="small" variant="outlined" color="inherit" onClick={() => on.onStop?.(r)}>
            {t('c3.chat.stopWork')}
          </Button>
        )}
        {failed && (
          <Button size="small" variant="outlined" color="inherit" onClick={() => on.onDismiss?.(r)}>
            {t('c3.chat.dismissFailure')}
          </Button>
        )}
        <Button size="small" startIcon={<Messages2 size={16} />} onClick={() => on.onOpen?.(r)} sx={{ marginInlineStart: 'auto' }}>
          {t('c3.chat.openConversation')}
        </Button>
      </Stack>
    </Paper>
  );
}
