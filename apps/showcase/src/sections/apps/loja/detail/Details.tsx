// Descrição, especificações e avaliações do produto.
import { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { TickCircle } from 'iconsax-reactjs';
import { Panel } from '@c3theme/ui';
import { CATEGORIES, COLORS, Product, rating } from '../data';
import Gallery from './Gallery';
import Reviews from './Reviews';
import ProductCard from '../ProductCard';
import { useStore } from '../store';
import { Info } from './Info';

function Details({ product }: { product: Product }) {
  const [tab, setTab] = useState(0);
  return (
    <Panel flush>
      <Tabs
        value={tab}
        onChange={(_, v: number) => setTab(v)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Descrição" id="aba-0" aria-controls="painel-0" />
        <Tab label="Especificações" id="aba-1" aria-controls="painel-1" />
        <Tab label={`Avaliações (${rating(product).total})`} id="aba-2" aria-controls="painel-2" />
      </Tabs>
      <Box role="tabpanel" id={`painel-${tab}`} aria-labelledby={`aba-${tab}`} sx={{ p: { xs: 2, sm: 3 } }}>
        {tab === 0 && (
          <Stack sx={{ gap: 2 }}>
            <Typography color="text.secondary">{product.descricao}</Typography>
            <Stack sx={{ gap: 1 }}>
              {product.destaques.map((d) => (
                <Stack key={d} direction="row" sx={{ gap: 1, alignItems: 'center' }}>
                  <Box sx={{ color: 'success.main', display: 'flex' }}>
                    <TickCircle size={18} variant="Bold" />
                  </Box>
                  <Typography variant="body2">{d}</Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        )}
        {tab === 1 && (
          <Table size="small" sx={{ maxWidth: 640 }}>
            <TableBody>
              {[
                ['Marca', product.marca],
                ['Categoria', CATEGORIES[product.categoria]],
                ['Cores', product.cores.map((c) => COLORS[c].nome).join(', ')],
                ...(product.tamanhos ? [['Tamanhos', product.tamanhos.join(', ')]] : []),
                ...product.especificacoes
              ].map(([k, v]) => (
                <TableRow key={k}>
                  <TableCell component="th" scope="row" sx={{ color: 'text.secondary', width: '40%' }}>
                    {k}
                  </TableCell>
                  <TableCell>{v}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {tab === 2 && <Reviews product={product} />}
      </Box>
    </Panel>
  );
}

export function ProductBody({ product }: { product: Product }) {
  const { products } = useStore();
  const [cor, setCor] = useState(product.cores[0]);
  const related = [
    ...products.filter((p) => p.id !== product.id && p.categoria === product.categoria),
    ...products.filter((p) => p.categoria !== product.categoria)
  ].slice(0, 4);

  return (
    <Stack sx={{ gap: 3 }}>
      <Panel>
        <Grid container spacing={{ xs: 3, md: 5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Gallery product={product} cor={cor} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Info product={product} cor={cor} onColor={setCor} />
          </Grid>
        </Grid>
      </Panel>
      <Details product={product} />
      <Box>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Você também pode gostar
        </Typography>
        <Grid container spacing={3}>
          {related.map((p) => (
            <Grid key={p.id} size={{ xs: 12, sm: 6, lg: 3 }}>
              <ProductCard product={p} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Stack>
  );
}
