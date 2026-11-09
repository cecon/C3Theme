// Envio de avatar.
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Camera, Trash } from 'iconsax-reactjs';
import { useDropzone } from 'react-dropzone';
import { notify, Panel } from '@c3theme/ui';
import DropArea from './DropArea';
import { reportRejections, useFiles } from './useFiles';
import { MB } from './SingleUpload';

// ---------- avatar ----------

export function AvatarUpload() {
  const { files, replace, clear } = useFiles(1);
  const dz = useDropzone({
    multiple: false,
    maxSize: MB,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    onDropAccepted: ([f]) => {
      replace(f);
      notify('Foto atualizada.');
    },
    onDropRejected: reportRejections
  });
  const item = files[0];

  return (
    <Panel title="Foto de perfil" subtitle="PNG ou JPG de até 1 MB">
      <Stack spacing={2} sx={{ alignItems: 'center' }}>
        <DropArea dz={dz} hint="" label="Trocar foto de perfil" sx={{ p: 0.75, borderRadius: '50%', width: 152, height: 152 }}>
          <Box
            sx={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              overflow: 'hidden',
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'action.hover',
              position: 'relative',
              '&:hover .overlay': { opacity: 1 }
            }}
          >
            {item?.preview ? (
              <Box component="img" src={item.preview} alt="Foto escolhida" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Stack sx={{ alignItems: 'center', color: 'text.secondary' }}>
                <Camera size={28} />
                <Typography variant="caption">Enviar foto</Typography>
              </Stack>
            )}
            {item && (
              <Box
                className="overlay"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'rgb(0 0 0 / 0.45)',
                  color: 'common.white',
                  opacity: 0,
                  transition: 'opacity .15s'
                }}
              >
                <Camera size={28} />
              </Box>
            )}
          </Box>
        </DropArea>
        {item ? (
          <Button size="small" color="error" startIcon={<Trash size={16} />} onClick={clear}>
            Remover foto
          </Button>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Clique ou arraste uma imagem sobre o círculo.
          </Typography>
        )}
      </Stack>
    </Panel>
  );
}
