import { FormEvent, useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third-party
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { notify, SoftAvatar } from '@c3theme/ui';
import { Product, rating, Review, seedReviews } from '../data';

const initials = (n: string) =>
  n
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

function ReviewForm({ onSubmit, onCancel }: { onSubmit: (r: Omit<Review, 'id' | 'data'>) => void; onCancel: () => void }) {
  const [nota, setNota] = useState<number | null>(null);
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [tried, setTried] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!nota || texto.trim().length < 10) return;
    onSubmit({ autor: 'Você', nota, titulo: titulo.trim() || 'Minha avaliação', texto: texto.trim() });
  }

  return (
    <Box component="form" onSubmit={submit} noValidate sx={{ p: 2.5, borderRadius: 2, bgcolor: 'action.hover' }}>
      <Stack sx={{ gap: 2 }}>
        <Box>
          <Typography variant="subtitle2" component="label" id="nota-label">
            Sua nota
          </Typography>
          <Rating value={nota} onChange={(_, v) => setNota(v)} size="large" aria-labelledby="nota-label" sx={{ display: 'flex' }} />
          {tried && !nota && (
            <Typography variant="caption" color="error">
              Escolha de 1 a 5 estrelas.
            </Typography>
          )}
        </Box>
        <TextField label="Título (opcional)" value={titulo} onChange={(e) => setTitulo(e.target.value)} fullWidth size="small" />
        <TextField
          label="Comentário"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          fullWidth
          multiline
          minRows={3}
          error={tried && texto.trim().length < 10}
          helperText={
            tried && texto.trim().length < 10 ? 'Escreva pelo menos 10 caracteres.' : 'Conte como foi a experiência com o produto.'
          }
        />
        <Stack direction="row" sx={{ gap: 1, justifyContent: 'flex-end' }}>
          <Button color="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained">
            Publicar
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

export default function Reviews({ product }: { product: Product }) {
  const [reviews, setReviews] = useState(() => seedReviews(product.id));
  const [writing, setWriting] = useState(false);
  // as notas novas entram na distribuição
  const extra = reviews.filter((r) => r.autor === 'Você');
  const notas = product.notas.map((n, i) => n + extra.filter((r) => r.nota === 5 - i).length) as Product['notas'];
  const { avg, total } = rating({ notas });

  return (
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack sx={{ gap: 1, alignItems: { xs: 'center', md: 'flex-start' } }}>
          <Typography variant="h2" component="p">
            {avg.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
          </Typography>
          <Rating value={avg} precision={0.1} readOnly />
          <Typography variant="body2" color="text.secondary">
            {total} avaliações
          </Typography>
        </Stack>
        <Stack sx={{ gap: 1, mt: 3 }}>
          {notas.map((n, i) => (
            <Stack key={i} direction="row" sx={{ gap: 1.5, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ width: 76, flexShrink: 0, whiteSpace: 'nowrap' }}>
                {5 - i} {5 - i === 1 ? 'estrela' : 'estrelas'}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={total ? (n / total) * 100 : 0}
                color="warning"
                sx={{ flex: 1, height: 8, borderRadius: 4 }}
                aria-label={`${5 - i} estrelas`}
              />
              <Typography variant="body2" color="text.secondary" sx={{ width: 28, textAlign: 'end' }}>
                {n}
              </Typography>
            </Stack>
          ))}
        </Stack>
        {!writing && (
          <Button variant="outlined" fullWidth sx={{ mt: 3 }} onClick={() => setWriting(true)}>
            Escrever avaliação
          </Button>
        )}
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <Collapse in={writing} unmountOnExit>
          <Box sx={{ mb: 3 }}>
            <ReviewForm
              onCancel={() => setWriting(false)}
              onSubmit={(r) => {
                setReviews((list) => [{ ...r, id: Date.now(), data: new Date().toISOString() }, ...list]);
                setWriting(false);
                notify('Obrigado! Sua avaliação foi publicada.');
              }}
            />
          </Box>
        </Collapse>
        <Stack divider={<Divider />} sx={{ gap: 2.5 }}>
          {reviews.map((r) => (
            <Stack key={r.id} direction="row" sx={{ gap: 2 }}>
              <SoftAvatar size="md" tone={r.autor === 'Você' ? 'primary' : 'secondary'}>
                {initials(r.autor)}
              </SoftAvatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle2">{r.autor}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(r.data), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                  </Typography>
                </Stack>
                <Rating value={r.nota} readOnly size="small" />
                <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
                  {r.titulo}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {r.texto}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Grid>
    </Grid>
  );
}
