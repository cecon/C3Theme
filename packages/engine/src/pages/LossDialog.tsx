// material-ui
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import { useText } from '../context';
import type { Text } from '../types';

/**
 * Confirmação antes de salvar quando uma seção com dado gravado ficou escondida (ex.: desmarcar o papel Cliente):
 * o backend grava null nos campos dela e exclui a lista, então o usuário precisa saber o que vai perder.
 */
export default function LossDialog({ sections, onCancel, onConfirm }: { sections?: Text[]; onCancel: () => void; onConfirm: () => void }) {
  const text = useText();
  const names = (sections ?? []).map((s) => text(s)).join(', ');
  return (
    <Dialog open={Boolean(sections?.length)} onClose={onCancel}>
      <DialogTitle>Apagar dados escondidos?</DialogTitle>
      <DialogContent>
        <DialogContentText>{`Com as escolhas atuais, ${names} não se aplica mais a este registro. Ao salvar, o que estava preenchido ali será apagado.`}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Voltar</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          Salvar e apagar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
