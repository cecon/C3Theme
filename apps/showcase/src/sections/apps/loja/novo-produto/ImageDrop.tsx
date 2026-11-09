// Imagens do produto: soltar, escolher, reordenar e remover.
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { CloseCircle, GalleryAdd } from 'iconsax-reactjs';
import { useDropzone, FileRejection } from 'react-dropzone';
import { notify } from '@c3theme/ui';
import { MAX_FILES, MAX_SIZE } from './schema';

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

export function ImageDrop({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const onDrop = async (accepted: File[], rejected: FileRejection[]) => {
    if (rejected.length) notify(`${rejected.length} arquivo(s) recusado(s): só imagens de até 2 MB.`, 'warning');
    const room = MAX_FILES - value.length;
    if (accepted.length > room) notify(`Máximo de ${MAX_FILES} imagens.`, 'warning');
    const urls = await Promise.all(accepted.slice(0, Math.max(0, room)).map(readAsDataUrl));
    onChange([...value, ...urls]);
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'] },
    maxSize: MAX_SIZE,
    disabled: value.length >= MAX_FILES
  });

  return (
    <Stack sx={{ gap: 2 }}>
      <Box
        {...getRootProps()}
        sx={(theme) => ({
          p: 3,
          textAlign: 'center',
          borderRadius: 2,
          border: 2,
          borderStyle: 'dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          bgcolor: isDragActive ? `rgb(${theme.vars.palette.primary.mainChannel} / 0.06)` : 'transparent',
          cursor: value.length >= MAX_FILES ? 'not-allowed' : 'pointer',
          opacity: value.length >= MAX_FILES ? 0.5 : 1,
          outline: 'none',
          '&:focus-visible': { borderColor: 'primary.main' }
        })}
      >
        <input {...getInputProps()} aria-label="Enviar imagens do produto" />
        <Box sx={{ color: 'primary.main', mb: 1 }}>
          <GalleryAdd size={36} variant="Bulk" />
        </Box>
        <Typography variant="subtitle2">{isDragActive ? 'Solte as imagens aqui' : 'Arraste imagens ou clique para escolher'}</Typography>
        <Typography variant="caption" color="text.secondary">
          PNG, JPG ou WEBP · até 2 MB cada · máximo {MAX_FILES}
        </Typography>
      </Box>
      {value.length > 0 && (
        <Grid container spacing={1.5}>
          {value.map((src, i) => (
            <Grid key={i} size={4}>
              <Box
                sx={{
                  position: 'relative',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: 1,
                  borderColor: i === 0 ? 'primary.main' : 'divider'
                }}
              >
                <Box
                  component="img"
                  src={src}
                  alt={`Imagem ${i + 1}`}
                  sx={{ display: 'block', width: 1, aspectRatio: '1 / 1', objectFit: 'cover' }}
                />
                {i === 0 && (
                  <Chip
                    label="Capa"
                    size="small"
                    color="primary"
                    sx={{ position: 'absolute', bottom: 4, insetInlineStart: 4, height: 20 }}
                  />
                )}
                <IconButton
                  size="small"
                  aria-label={`Remover imagem ${i + 1}`}
                  onClick={() => onChange(value.filter((_, k) => k !== i))}
                  sx={{
                    position: 'absolute',
                    top: 2,
                    insetInlineEnd: 2,
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'background.paper' }
                  }}
                >
                  <CloseCircle size={16} />
                </IconButton>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
