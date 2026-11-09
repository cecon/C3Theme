// material-ui
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

/** Confirmação de excluir o registro aberto. */
export default function DeleteDialog({
  open,
  title,
  onCancel,
  onConfirm
}: {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{`Excluir ${title}?`}</DialogTitle>
      <DialogContent>
        <DialogContentText>Esta ação não pode ser desfeita.</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          Excluir
        </Button>
      </DialogActions>
    </Dialog>
  );
}
