import { useEffect, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { ArrowLeft2, ArrowRight2, CloseCircle } from 'iconsax-reactjs';

const MIN = 1;
const MAX = 4;

/**
 * Visualizador da galeria (#13): a imagem em tela cheia, com anterior e próxima (setas do teclado também), zoom pela
 * roda do mouse e Esc para fechar. "Abrir registro" leva ao registro da imagem.
 */
export default function ImageViewer(props: {
  items: { src: string; title: string }[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  onOpen: (i: number) => void;
}) {
  const { items, index, onIndex, onClose, onOpen } = props;
  const [zoom, setZoom] = useState(1);
  const item = items[index];
  const go = (step: number) => onIndex((index + step + items.length) % items.length);
  useEffect(() => setZoom(1), [index]);

  if (!item) return null;
  return (
    <Dialog
      open
      fullScreen
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1);
        else if (e.key === 'ArrowLeft') go(-1);
      }}
      slotProps={{ paper: { 'aria-label': item.title, sx: { bgcolor: 'common.black', color: 'common.white' } } }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', p: 1.5 }}>
        <Typography sx={{ flex: 1, minWidth: 0 }} noWrap>
          {item.title} · {index + 1} de {items.length}
        </Typography>
        <Button color="inherit" variant="outlined" size="small" onClick={() => onOpen(index)}>
          Abrir registro
        </Button>
        <IconButton color="inherit" aria-label="Fechar" onClick={onClose}>
          <CloseCircle size={22} />
        </IconButton>
      </Stack>
      <Box
        sx={{ flex: 1, display: 'grid', placeItems: 'center', overflow: 'auto', position: 'relative' }}
        onWheel={(e) => setZoom((z) => Math.min(MAX, Math.max(MIN, z - Math.sign(e.deltaY) * 0.25)))}
      >
        <Box
          component="img"
          src={item.src}
          alt={item.title}
          sx={{ maxWidth: '100%', maxHeight: '100%', transform: `scale(${zoom})`, transition: 'transform .15s', touchAction: 'pinch-zoom' }}
        />
        {items.length > 1 && (
          <>
            <IconButton
              color="inherit"
              aria-label="Anterior"
              onClick={() => go(-1)}
              sx={{ position: 'absolute', left: 8, bgcolor: 'rgba(0,0,0,.4)' }}
            >
              <ArrowLeft2 size={24} />
            </IconButton>
            <IconButton
              color="inherit"
              aria-label="Próxima"
              onClick={() => go(1)}
              sx={{ position: 'absolute', right: 8, bgcolor: 'rgba(0,0,0,.4)' }}
            >
              <ArrowRight2 size={24} />
            </IconButton>
          </>
        )}
      </Box>
    </Dialog>
  );
}
