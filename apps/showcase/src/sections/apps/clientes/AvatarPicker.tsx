// Foto do cliente: escolher, trocar e remover.
import { ChangeEvent, useRef } from 'react';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Camera, CloseCircle } from 'iconsax-reactjs';
import { notify, SoftAvatar, SoftIconButton } from '@c3theme/ui';
import { initials } from './data';

const MAX_FOTO = 2 * 1024 * 1024;

export function AvatarPicker({ value, name, onChange }: { value?: string; name: string; onChange: (v?: string) => void }) {
  const input = useRef<HTMLInputElement>(null);

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return notify('Escolha um arquivo de imagem.', 'warning');
    if (file.size > MAX_FOTO) return notify('A foto deve ter no máximo 2 MB.', 'warning');
    // data URL: a prévia continua válida depois que o diálogo fecha
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <Stack sx={{ alignItems: 'center', gap: 1 }}>
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <SoftIconButton
            size="small"
            shape="circle"
            aria-label="Escolher foto"
            onClick={() => input.current?.click()}
            sx={{ bgcolor: 'background.paper', boxShadow: 2 }}
          >
            <Camera size={16} />
          </SoftIconButton>
        }
      >
        <SoftAvatar size="xl" src={value} alt={name} sx={{ width: 96, height: 96, fontSize: 32 }}>
          {initials(name) || '?'}
        </SoftAvatar>
      </Badge>
      <input ref={input} type="file" accept="image/*" hidden onChange={pick} aria-label="Arquivo da foto" />
      {value ? (
        <Button size="small" color="error" startIcon={<CloseCircle size={16} />} onClick={() => onChange(undefined)}>
          Remover foto
        </Button>
      ) : (
        <Typography variant="caption" color="text.secondary">
          JPG ou PNG, até 2 MB
        </Typography>
      )}
    </Stack>
  );
}
