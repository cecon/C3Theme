import { useId, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

export default function SidebarEditor({
  title,
  initial,
  onClose,
  onSave
}: {
  title: string;
  initial: string;
  onClose: () => void;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const id = useId();
  return (
    <Dialog open onClose={onClose} aria-labelledby={id} fullWidth maxWidth="xs">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onSave(value.trim());
        }}
      >
        <DialogTitle id={id}>{title}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Nome"
            value={value}
            fullWidth
            margin="dense"
            onChange={(e) => setValue(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 120 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={!value.trim()}>
            Salvar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
