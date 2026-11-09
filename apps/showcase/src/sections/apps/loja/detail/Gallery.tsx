import { MouseEvent, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';

// third-party
import { ArrowLeft2, ArrowRight2, CloseCircle, SearchZoomIn } from 'iconsax-reactjs';

import type { ColorId, Product } from '../data';
import ProductArt from '../ProductArt';

const VIEWS = 4;

/** Imagem principal com lupa ao passar o mouse, miniaturas e ampliação em tela cheia. */
export default function Gallery({ product, cor }: { product: Product; cor: ColorId }) {
  const [index, setIndex] = useState(0);
  const [origin, setOrigin] = useState<string>();
  const [full, setFull] = useState(false);
  const count = product.imagens?.length || VIEWS;
  const art = (i: number, alt: string) => (
    <ProductArt forma={product.forma} cor={cor} view={i} src={product.imagens?.[i]} alt={alt} sx={{ borderRadius: 0 }} />
  );

  function move(e: MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  }

  const step = (d: number) => setIndex((i) => (i + d + count) % count);

  return (
    <Stack sx={{ gap: 1.5 }}>
      <Box
        onMouseMove={move}
        onMouseLeave={() => setOrigin(undefined)}
        sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', cursor: 'zoom-in', border: 1, borderColor: 'divider' }}
        onClick={() => setFull(true)}
      >
        <Box sx={{ transition: 'transform .15s', transform: origin ? 'scale(2)' : 'none', transformOrigin: origin }}>
          {art(index, `${product.nome}, imagem ${index + 1}`)}
        </Box>
        <IconButton
          aria-label="Ampliar imagem"
          onClick={(e) => {
            e.stopPropagation();
            setFull(true);
          }}
          sx={{
            position: 'absolute',
            bottom: 12,
            insetInlineEnd: 12,
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'background.paper' }
          }}
        >
          <SearchZoomIn size={20} />
        </IconButton>
      </Box>
      <Stack direction="row" sx={{ gap: 1.5 }}>
        {Array.from({ length: count }, (_, i) => (
          <ButtonBase
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Ver imagem ${i + 1}`}
            aria-current={i === index}
            sx={{
              flex: 1,
              maxWidth: 96,
              borderRadius: 2,
              overflow: 'hidden',
              border: 2,
              borderColor: i === index ? 'primary.main' : 'transparent',
              opacity: i === index ? 1 : 0.75,
              '&:hover': { opacity: 1 }
            }}
          >
            {art(i, '')}
          </ButtonBase>
        ))}
      </Stack>

      <Dialog open={full} onClose={() => setFull(false)} maxWidth="md" fullWidth aria-label="Imagem ampliada">
        <Box sx={{ position: 'relative' }}>
          {art(index, `${product.nome}, imagem ${index + 1} ampliada`)}
          <IconButton
            aria-label="Fechar"
            onClick={() => setFull(false)}
            sx={{ position: 'absolute', top: 8, insetInlineEnd: 8, bgcolor: 'background.paper' }}
          >
            <CloseCircle size={20} />
          </IconButton>
          <IconButton
            aria-label="Imagem anterior"
            onClick={() => step(-1)}
            sx={{ position: 'absolute', top: '50%', insetInlineStart: 8, bgcolor: 'background.paper' }}
          >
            <ArrowLeft2 size={20} />
          </IconButton>
          <IconButton
            aria-label="Próxima imagem"
            onClick={() => step(1)}
            sx={{ position: 'absolute', top: '50%', insetInlineEnd: 8, bgcolor: 'background.paper' }}
          >
            <ArrowRight2 size={20} />
          </IconButton>
        </Box>
      </Dialog>
    </Stack>
  );
}
