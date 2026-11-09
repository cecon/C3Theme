import { ReactNode } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Trash } from 'iconsax-reactjs';

import SoftAvatar from './SoftAvatar';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}

/** Confirmação antes de uma ação destrutiva (excluir cliente, produto, endereço): ícone de lixeira, título e o que se perde. */
export default function ConfirmDialog({ open, title, description, confirmLabel = 'Excluir', onClose, onConfirm }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth aria-labelledby="confirmar-titulo">
      <DialogContent sx={{ pt: 4 }}>
        <Stack sx={{ alignItems: 'center', textAlign: 'center', gap: 1.5 }}>
          <SoftAvatar tone="danger" size="xl">
            <Trash size={32} variant="Bulk" />
          </SoftAvatar>
          <Typography id="confirmar-titulo" variant="h4">
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button fullWidth variant="outlined" color="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          fullWidth
          variant="contained"
          color="error"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
