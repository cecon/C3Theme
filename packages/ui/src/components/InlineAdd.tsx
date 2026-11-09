import { FormEvent, useState } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

// third-party
import { Add } from 'iconsax-reactjs';

export interface InlineAddProps {
  label: string;
  placeholder: string;
  onAdd: (title: string) => void;
  defaultOpen?: boolean;
  /** Erro do texto digitado (mostrado embaixo do campo e impede adicionar), ou nada se estiver certo. */
  validate?: (title: string) => string | undefined;
  /** Modo do teclado no celular, ex.: "tel". */
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
}

/** Botão "adicionar" que vira um campo de texto; Enter confirma, Esc cancela. */
export default function InlineAdd({ label, placeholder, onAdd, defaultOpen = false, validate, inputMode }: InlineAddProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [title, setTitle] = useState('');
  const [tried, setTried] = useState(false);
  const error = validate && title.trim() ? validate(title.trim()) : undefined;

  function close() {
    setOpen(false);
    setTitle('');
    setTried(false);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!title.trim() || error) return;
    onAdd(title.trim());
    setTitle('');
    setTried(false);
  }

  if (!open) {
    return (
      <Button fullWidth color="secondary" startIcon={<Add size={18} />} onClick={() => setOpen(true)} sx={{ justifyContent: 'flex-start' }}>
        {label}
      </Button>
    );
  }

  return (
    <Stack component="form" onSubmit={submit} spacing={1}>
      <TextField
        autoFocus
        size="small"
        value={title}
        placeholder={placeholder}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && close()}
        error={tried && !!error}
        helperText={tried && error ? error : undefined}
        slotProps={{ htmlInput: { 'aria-label': placeholder, inputMode } }}
        fullWidth
      />
      <Stack direction="row" spacing={1}>
        <Button type="submit" size="small" variant="contained" disabled={!title.trim()}>
          Adicionar
        </Button>
        <Button size="small" color="secondary" onClick={close}>
          Cancelar
        </Button>
      </Stack>
    </Stack>
  );
}
