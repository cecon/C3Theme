// material-ui
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import { useText } from '../../context';
import type { PendingChange } from './useGuardedChange';

/** A pergunta do `confirmChange` antes de gravar: o efeito embaixo, Cancelar volta o valor. */
export default function ConfirmChangeDialog({
  pending,
  onConfirm,
  onCancel
}: {
  pending?: PendingChange;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const text = useText();
  const c = pending?.field.confirmChange;
  return (
    <Dialog open={Boolean(c)} onClose={onCancel} maxWidth="xs" fullWidth aria-labelledby="confirmar-ajuste">
      <DialogTitle id="confirmar-ajuste">{c && text(c.message)}</DialogTitle>
      {c?.effect && (
        <DialogContent>
          <DialogContentText>{text(c.effect)}</DialogContentText>
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button variant="contained" onClick={onConfirm} autoFocus>
          {c ? text(c.confirmLabel, 'Confirmar') : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
