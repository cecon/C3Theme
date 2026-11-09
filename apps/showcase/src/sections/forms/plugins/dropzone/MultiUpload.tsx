// Envio de vários arquivos, em lista ou grade.
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { CloseCircle, Element3, RowVertical } from 'iconsax-reactjs';
import { useDropzone } from 'react-dropzone';
import { notify, Panel } from '@c3theme/ui';
import DropArea from './DropArea';
import { formatSize, reportRejections, useFiles } from './useFiles';
import { MB, Thumb } from './SingleUpload';

// ---------- vários arquivos ----------

type View = 'lista' | 'grade';

export function MultiUpload() {
  const { files, add, remove, clear } = useFiles(8);
  const [view, setView] = useState<View>('lista');
  const [progress, setProgress] = useState<number | null>(null);
  const dz = useDropzone({
    maxSize: 2 * MB,
    accept: { 'image/*': [], 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'text/csv': ['.csv'] },
    onDropAccepted: add,
    onDropRejected: reportRejections,
    disabled: progress !== null
  });

  // simula o envio ao servidor com uma barra de progresso
  const upload = () => {
    let p = 0;
    setProgress(0);
    const t = window.setInterval(() => {
      p += 20;
      setProgress(p);
      if (p >= 100) {
        window.clearInterval(t);
        window.setTimeout(() => {
          setProgress(null);
          notify(`${files.length} arquivo(s) enviado(s).`);
          clear();
        }, 300);
      }
    }, 250);
  };

  return (
    <Panel
      title="Vários arquivos"
      subtitle="Até 8 arquivos de no máximo 2 MB: imagens, PDF, TXT ou CSV"
      action={
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(_, v: View | null) => v && setView(v)}
          aria-label="Modo de exibição"
        >
          <ToggleButton value="lista" aria-label="Ver em lista">
            <RowVertical size={16} />
          </ToggleButton>
          <ToggleButton value="grade" aria-label="Ver em grade">
            <Element3 size={16} />
          </ToggleButton>
        </ToggleButtonGroup>
      }
    >
      <DropArea dz={dz} hint="Você pode soltar vários de uma vez" />

      {files.length > 0 && (
        <>
          {view === 'lista' ? (
            <Stack spacing={1} sx={{ mt: 2 }}>
              {files.map((f) => (
                <Stack
                  key={f.id}
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: 'center', p: 1, border: 1, borderColor: 'divider', borderRadius: 2 }}
                >
                  <Thumb item={f} size={40} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {f.file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatSize(f.file.size)}
                    </Typography>
                  </Box>
                  <IconButton aria-label={`Remover ${f.file.name}`} size="small" onClick={() => remove(f.id)} disabled={progress !== null}>
                    <CloseCircle size={18} />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 1.5 }}>
              {files.map((f) => (
                <Box
                  key={f.id}
                  sx={{ position: 'relative', border: 1, borderColor: 'divider', borderRadius: 2, p: 1, textAlign: 'center' }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Thumb item={f} size={72} />
                  </Box>
                  <Typography variant="caption" noWrap component="div" sx={{ mt: 0.5 }}>
                    {f.file.name}
                  </Typography>
                  <IconButton
                    aria-label={`Remover ${f.file.name}`}
                    size="small"
                    onClick={() => remove(f.id)}
                    disabled={progress !== null}
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
              ))}
            </Box>
          )}

          {progress !== null && <LinearProgress variant="determinate" value={progress} sx={{ mt: 2 }} />}
          <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
              {files.length} arquivo(s) · {formatSize(files.reduce((s, f) => s + f.file.size, 0))}
            </Typography>
            <Button color="secondary" onClick={clear} disabled={progress !== null}>
              Remover todos
            </Button>
            <Button variant="contained" onClick={upload} loading={progress !== null}>
              Enviar
            </Button>
          </Stack>
        </>
      )}
    </Panel>
  );
}
