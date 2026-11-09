// Envio de um arquivo, com miniatura.
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Document, Trash } from 'iconsax-reactjs';
import { useDropzone } from 'react-dropzone';
import { Panel, SoftAvatar } from '@c3theme/ui';
import DropArea from './DropArea';
import { formatSize, reportRejections, UploadFile, useFiles } from './useFiles';

export const MB = 1024 * 1024;

export function Thumb({ item, size = 48 }: { item: UploadFile; size?: number }) {
  if (item.preview) {
    return (
      <Box
        component="img"
        src={item.preview}
        alt=""
        sx={{ width: size, height: size, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <SoftAvatar tone="secondary" variant="rounded" sx={{ width: size, height: size }}>
      <Document size={size / 2} />
    </SoftAvatar>
  );
}

// ---------- arquivo único ----------

export function SingleUpload() {
  const { files, replace, clear } = useFiles(1);
  const dz = useDropzone({
    multiple: false,
    maxSize: 5 * MB,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
    onDropAccepted: ([f]) => replace(f),
    onDropRejected: reportRejections
  });
  const item = files[0];

  return (
    <Panel title="Imagem única" subtitle="Uma imagem de até 5 MB; a nova substitui a anterior">
      <DropArea dz={dz} hint="PNG, JPG, WEBP ou GIF" sx={{ p: item ? 1 : 3 }}>
        {item?.preview && (
          <Box
            component="img"
            src={item.preview}
            alt={item.file.name}
            sx={{ display: 'block', width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 2 }}
          />
        )}
      </DropArea>
      {item && (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: 'center' }}>
          <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
            {item.file.name} · {formatSize(item.file.size)}
          </Typography>
          <Button size="small" color="error" startIcon={<Trash size={16} />} onClick={clear}>
            Remover
          </Button>
        </Stack>
      )}
    </Panel>
  );
}
