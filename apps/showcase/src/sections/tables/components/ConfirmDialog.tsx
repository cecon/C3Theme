import { ReactNode } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface ConfirmDialogProps {
  open: boolean;
  titulo: string;
  children: ReactNode;
  confirmar?: string;
  onClose: () => void;
  onConfirm: () => void;
}

/** Confirmação antes de uma ação destrutiva (excluir linhas). */
export default function ConfirmDialog({ open, titulo, children, confirmar = 'Excluir', onClose, onConfirm }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <DialogContentText>{children}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmar}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
