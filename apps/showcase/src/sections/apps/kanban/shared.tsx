import { ReactNode } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { differenceInCalendarDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar1 } from 'iconsax-reactjs';

import { SoftAvatar, softColors, StatusChip, type SoftAvatarProps } from '@c3theme/ui';
import { Member, PRIORITY, Priority } from './data';

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function MemberAvatar({ member, size = 'sm' }: { member?: Member; size?: SoftAvatarProps['size'] }) {
  if (!member) {
    return (
      <Tooltip title="Sem responsável">
        <SoftAvatar tone="neutral" size={size} look="outlined" sx={{ borderStyle: 'dashed' }}>
          ?
        </SoftAvatar>
      </Tooltip>
    );
  }
  return (
    <Tooltip title={member.name}>
      <SoftAvatar tone={member.tone} size={size} aria-label={member.name}>
        {initials(member.name)}
      </SoftAvatar>
    </Tooltip>
  );
}

export function PriorityChip({ priority }: { priority: Priority }) {
  return <StatusChip label={PRIORITY[priority].label} tone={PRIORITY[priority].tone} />;
}

/** Prazo com destaque: vencido em vermelho, nos próximos 2 dias em amarelo. */
export function DueChip({ due, done }: { due: Date; done?: boolean }) {
  const days = differenceInCalendarDays(due, new Date());
  const tone = done ? 'success' : days < 0 ? 'danger' : days <= 2 ? 'warning' : 'neutral';
  const hint = done ? 'Concluído' : days < 0 ? 'Atrasado' : days === 0 ? 'Vence hoje' : `Vence em ${days} dia${days > 1 ? 's' : ''}`;
  return (
    <Tooltip title={hint}>
      <Chip
        size="small"
        icon={<Calendar1 size={14} />}
        label={format(due, 'd MMM', { locale: ptBR })}
        sx={(theme) => ({ ...softColors(theme, tone), '& .MuiChip-icon': { color: 'inherit' } })}
      />
    </Tooltip>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Confirmação antes de ações destrutivas. */
export function ConfirmDialog({ open, title, children, confirmLabel = 'Excluir', onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">{children}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button color="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
