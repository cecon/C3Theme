// Cards com estado: completo e com abas.
import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { ArrowDown2, Heart, More, Share } from 'iconsax-reactjs';
import { notify, SoftAvatar, StatusChip } from '@c3theme/ui';
import { brl, illustration } from '../../data';

export function ComplexDemo() {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  return (
    <Card sx={{ maxWidth: 380 }}>
      <CardHeader
        avatar={<SoftAvatar tone="warning">PD</SoftAvatar>}
        action={
          <IconButton aria-label="Mais opções">
            <More size={20} />
          </IconButton>
        }
        title="Padaria Pão Dourado"
        subheader="12 de outubro de 2026"
      />
      <CardMedia component="img" height="170" image={illustration(30, 'Vitrine nova')} alt="Ilustração de paisagem" />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          A reforma da vitrine ficou pronta! Agora os pães de fermentação natural ficam expostos logo na entrada.
        </Typography>
      </CardContent>
      <CardActions disableSpacing>
        <IconButton
          aria-label={liked ? 'Descurtir' : 'Curtir'}
          onClick={() => setLiked(!liked)}
          sx={{ color: liked ? 'error.main' : undefined }}
        >
          <Heart size={20} variant={liked ? 'Bold' : 'Linear'} />
        </IconButton>
        <IconButton aria-label="Compartilhar" onClick={() => notify('Link copiado.', 'info')}>
          <Share size={20} />
        </IconButton>
        <IconButton
          aria-label={expanded ? 'Mostrar menos' : 'Mostrar mais'}
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          sx={{ ml: 'auto', transition: 'transform .2s', transform: expanded ? 'rotate(180deg)' : 'none' }}
        >
          <ArrowDown2 size={18} />
        </IconButton>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 0 }}>
          <Typography variant="subtitle2" gutterBottom>
            Detalhes da obra
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Prazo de 15 dias, vidro temperado com iluminação em LED e balcão refrigerado novo. Orçamento final de {brl.format(18750)}.
          </Typography>
        </CardContent>
      </Collapse>
    </Card>
  );
}

export function TabsCardDemo() {
  const [tab, setTab] = useState(0);
  const data = [
    { label: 'Hoje', sales: 4210.9, orders: 38 },
    { label: 'Semana', sales: 28940, orders: 251 },
    { label: 'Mês', sales: 118320.5, orders: 1034 }
  ];
  const d = data[tab]!;
  return (
    <Card>
      <CardHeader title="Vendas" slotProps={{ title: { variant: 'h5' } }} action={<StatusChip label="+12%" tone="success" />} />
      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {data.map((x) => (
          <Tab key={x.label} label={x.label} />
        ))}
      </Tabs>
      <CardContent>
        <Stack direction="row" spacing={3}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Faturamento
            </Typography>
            <Typography variant="h3">{brl.format(d.sales)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Pedidos
            </Typography>
            <Typography variant="h3">{d.orders}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
