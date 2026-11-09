// Peças comuns: envio simulado, ações e senha.
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import { Eye, EyeSlash } from 'iconsax-reactjs';
import { notify } from '@c3theme/ui';

/** Simula o envio ao servidor e avisa o resultado. */
export const fakeSend = (msg: string) => new Promise<void>((resolve) => window.setTimeout(resolve, 600)).then(() => notify(msg));

export function FormActions({ loading, onReset }: { loading: boolean; onReset: () => void }) {
  return (
    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
      <Button color="secondary" onClick={onReset}>
        Limpar
      </Button>
      <Button type="submit" variant="contained" loading={loading}>
        Enviar
      </Button>
    </Stack>
  );
}

export function PasswordInput({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <InputAdornment position="end">
      <IconButton aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} onClick={onToggle} edge="end" size="small">
        {show ? <EyeSlash size={18} /> : <Eye size={18} />}
      </IconButton>
    </InputAdornment>
  );
}
