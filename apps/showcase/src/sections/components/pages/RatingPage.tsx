import { ReactNode, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Heart, Star1 } from 'iconsax-reactjs';

import Example, { ExamplePage } from '../Example';

const LABELS: Record<number, string> = {
  0.5: 'Péssimo',
  1: 'Muito ruim',
  1.5: 'Ruim',
  2: 'Fraco',
  2.5: 'Regular',
  3: 'Razoável',
  3.5: 'Bom',
  4: 'Muito bom',
  4.5: 'Ótimo',
  5: 'Excelente'
};

function HoverDemo() {
  const [value, setValue] = useState<number | null>(3.5);
  const [hover, setHover] = useState(-1);
  const shown = hover !== -1 ? hover : value;
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      <Rating
        name="hover-feedback"
        value={value}
        precision={0.5}
        getLabelText={(v) => `${v} estrela${v !== 1 ? 's' : ''}, ${LABELS[v]}`}
        onChange={(_, v) => setValue(v)}
        onChangeActive={(_, v) => setHover(v)}
      />
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90 }}>
        {shown !== null ? LABELS[shown] : 'Sem nota'}
      </Typography>
    </Stack>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Typography component="legend" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function ControlledDemo() {
  const [value, setValue] = useState<number | null>(4);
  return (
    <Stack spacing={2}>
      <Labeled label="Controlado">
        <Rating name="controlado" value={value} onChange={(_, v) => setValue(v)} />
      </Labeled>
      <Labeled label="Somente leitura">
        <Rating name="leitura" value={value} readOnly />
      </Labeled>
      <Labeled label="Desabilitado">
        <Rating name="desabilitado" value={value} disabled />
      </Labeled>
      <Labeled label="Sem nota">
        <Rating name="vazio" value={null} readOnly />
      </Labeled>
    </Stack>
  );
}

export default function RatingPage() {
  return (
    <ExamplePage intro="A avaliação mostra ou coleta uma nota, normalmente de 1 a 5 estrelas.">
      <Example
        title="Básico"
        code={`<Rating name="nota" value={nota} onChange={(_, v) => setNota(v)} />
<Rating value={nota} readOnly />`}
      >
        <ControlledDemo />
      </Example>

      <Example
        title="Precisão"
        description="Meia estrela ou frações menores."
        code={`<Rating defaultValue={2.5} precision={0.5} />
<Rating defaultValue={3.7} precision={0.1} readOnly />`}
      >
        <Stack spacing={2}>
          <Labeled label="Meia estrela">
            <Rating name="meia" defaultValue={2.5} precision={0.5} />
          </Labeled>
          <Labeled label="Décimos (somente leitura) – 3,7">
            <Rating name="decimos" defaultValue={3.7} precision={0.1} readOnly />
          </Labeled>
        </Stack>
      </Example>

      <Example
        title="Retorno ao passar o mouse"
        description="O texto acompanha a estrela sob o cursor."
        code={`<Rating precision={0.5} onChangeActive={(_, v) => setHover(v)} />`}
      >
        <HoverDemo />
      </Example>

      <Example
        title="Tamanhos"
        code={`<Rating size="small" />
<Rating size="large" />`}
      >
        <Stack spacing={1.5}>
          <Rating name="pequeno" defaultValue={3} size="small" />
          <Rating name="medio" defaultValue={3} />
          <Rating name="grande" defaultValue={3} size="large" />
        </Stack>
      </Example>

      <Example
        title="Personalizado"
        description="Outros ícones, cores e quantidade de itens."
        code={`<Rating icon={<Heart variant="Bold" />} emptyIcon={<Heart />} sx={{ color: 'error.main' }} />
<Rating max={10} />`}
        wide
      >
        <Stack spacing={2}>
          <Labeled label="Corações">
            <Rating
              name="coracoes"
              defaultValue={3}
              precision={0.5}
              icon={<Heart size={22} variant="Bold" />}
              emptyIcon={<Heart size={22} />}
              getLabelText={(v) => `${v} coraç${v !== 1 ? 'ões' : 'ão'}`}
              sx={{ color: 'error.main', '& .MuiRating-iconHover': { color: 'error.dark' } }}
            />
          </Labeled>
          <Labeled label="Ícones do tema na cor primária">
            <Rating
              name="primaria"
              defaultValue={4}
              icon={<Star1 size={22} variant="Bold" />}
              emptyIcon={<Star1 size={22} />}
              sx={{ color: 'primary.main' }}
            />
          </Labeled>
          <Labeled label="Escala de 10">
            <Rating name="dez" defaultValue={7} max={10} />
          </Labeled>
        </Stack>
      </Example>
    </ExamplePage>
  );
}
