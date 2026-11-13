import type { ReactNode } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export type AgentDockPosition = 'top' | 'bottom' | 'right';
export type AgentDockStatus = 'idle' | 'running' | 'waiting-approval' | 'failed' | 'done';
export interface AgentDockItem {
  id: string;
  label: string;
  mark?: string;
  status: AgentDockStatus;
  approvals?: number;
}
export interface AgentDockProps {
  label: string;
  items: readonly AgentDockItem[];
  position?: AgentDockPosition;
  loading?: boolean;
  error?: boolean;
  offline?: boolean;
  messages?: Partial<Record<'loading' | 'empty' | 'error' | 'offline' | 'retry', string>>;
  statusLabels?: Partial<Record<AgentDockStatus, string>>;
  emptyAction?: ReactNode;
  onRetry?: () => void;
  onSelect: (id: string) => void;
}
const labels: Record<AgentDockStatus, string> = {
  idle: 'Ocioso',
  running: 'Executando',
  'waiting-approval': 'Aguardando aprovação',
  failed: 'Falhou',
  done: 'Concluído'
};
/** Faixa da casca; o contêiner reserva a área, nunca flutua por cima da conversa. */
export default function AgentDock({
  label,
  items,
  position = 'bottom',
  loading,
  error,
  offline,
  messages,
  statusLabels,
  emptyAction,
  onRetry,
  onSelect
}: AgentDockProps) {
  const status = { ...labels, ...statusLabels };
  return (
    <Box
      component="section"
      aria-label={label}
      aria-busy={loading || undefined}
      sx={{ height: '100%', overflow: 'auto', bgcolor: 'background.paper', color: 'text.primary', p: 1 }}
    >
      <Box
        role="status"
        aria-live="polite"
        aria-atomic="true"
        sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}
      >
        {items.map((item) => `${item.label}: ${status[item.status]}${item.approvals ? `, ${item.approvals} aprovações` : ''}`).join('. ')}
      </Box>
      {offline && (
        <Typography variant="caption" role="status">
          {messages?.offline ?? 'Sem conexão · último estado conhecido'}
        </Typography>
      )}
      {loading && !items.length ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <CircularProgress size={16} aria-label={messages?.loading ?? 'Carregando agentes…'} />
          <span>{messages?.loading ?? 'Carregando agentes…'}</span>
        </Stack>
      ) : error ? (
        <Alert
          severity="error"
          action={
            onRetry && (
              <Button color="inherit" onClick={onRetry}>
                {messages?.retry ?? 'Tentar de novo'}
              </Button>
            )
          }
        >
          {messages?.error ?? 'Não foi possível carregar os agentes.'}
        </Alert>
      ) : !items.length ? (
        <Stack spacing={1}>
          <span>{messages?.empty ?? 'Nenhum agente ativo.'}</span>
          {emptyAction}
        </Stack>
      ) : null}
      <Stack
        direction={position === 'right' ? 'column' : 'row'}
        spacing={1}
        sx={{ width: 'max-content', minWidth: position === 'right' ? '100%' : undefined }}
      >
        {items.map((item) => (
          <ButtonBase
            key={item.id}
            onClick={() => onSelect(item.id)}
            aria-label={`${item.label} · ${status[item.status]}${item.approvals ? ` · ${item.approvals} aprovações` : ''}`}
            sx={{
              borderRadius: 1,
              p: 0.5,
              gap: 1,
              justifyContent: 'flex-start',
              border: 1,
              borderColor: item.status === 'waiting-approval' ? 'warning.main' : 'divider',
              bgcolor: item.status === 'waiting-approval' ? 'action.selected' : undefined,
              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 }
            }}
          >
            <Badge badgeContent={item.approvals} color="warning">
              <Avatar sx={{ width: 28, height: 28, fontSize: 14, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                {item.mark ?? item.label.slice(0, 1)}
              </Avatar>
            </Badge>
            <Box sx={{ textAlign: 'left', pr: 0.5 }}>
              <Typography variant="body2">{item.label}</Typography>
              <Typography variant="caption" color="text.secondary">
                {status[item.status]}
              </Typography>
            </Box>
          </ButtonBase>
        ))}
      </Stack>
    </Box>
  );
}
