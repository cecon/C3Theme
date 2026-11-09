// material-ui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Box1, Chart21, Instagram, ScanBarcode, Whatsapp, Youtube } from 'iconsax-reactjs';

import { notify, SoftAvatar } from '@c3theme/ui';
import { Countdown, LAUNCH, SubscribeForm, TopBar } from './shared';

const PREVIEW = [
  { icon: Box1, title: 'Estoque em tempo real', text: 'Entradas, saídas e alertas de mínimo por loja.' },
  { icon: ScanBarcode, title: 'Leitura de código de barras', text: 'Pela câmera do celular, sem leitor extra.' },
  { icon: Chart21, title: 'Curva ABC automática', text: 'Saiba o que gira e o que está parado.' }
];

const SOCIAL = [
  { icon: Instagram, label: 'Instagram' },
  { icon: Youtube, label: 'YouTube' },
  { icon: Whatsapp, label: 'WhatsApp' }
];

/** Em breve, versão 2: tela dividida com contagem grande e prévia do que vem. */
export default function ComingSoonPage2() {
  return (
    <Grid container sx={{ minHeight: '100vh', bgcolor: 'background.default', position: 'relative' }}>
      <TopBar />
      <Grid
        size={{ xs: 12, md: 7 }}
        sx={{ display: 'flex', alignItems: 'center', px: { xs: 2, sm: 6, lg: 10 }, pt: { xs: 12, md: 10 }, pb: 6 }}
      >
        <Box sx={{ maxWidth: 600 }}>
          <Typography variant="overline" color="primary.main">
            Lançamento em {format(LAUNCH, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '2.25rem', sm: '3.25rem' }, lineHeight: 1.1, mt: 1 }}>
            O módulo de estoque está quase pronto.
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Faltam poucos ajustes. Inscreva-se para ganhar 30 dias grátis no lançamento.
          </Typography>
          <Box sx={{ my: 4 }}>
            <Countdown size="large" />
          </Box>
          <SubscribeForm cta="Quero ser avisado" />
          <Stack direction="row" spacing={1} sx={{ mt: 4, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Acompanhe:
            </Typography>
            {SOCIAL.map(({ icon: Icon, label }) => (
              <IconButton key={label} aria-label={label} onClick={() => notify(`Link do ${label} (simulação).`, 'info')}>
                <Icon size={20} />
              </IconButton>
            ))}
          </Stack>
        </Box>
      </Grid>
      <Grid
        size={{ xs: 12, md: 5 }}
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 6 },
          background: `linear-gradient(200deg, ${theme.vars.palette.primary.main}, ${theme.vars.palette.primary.dark})`,
          color: 'primary.contrastText'
        })}
      >
        <Stack spacing={2} sx={{ width: '100%', maxWidth: 380 }}>
          <Typography variant="h4" color="inherit">
            O que vem por aí
          </Typography>
          {PREVIEW.map(({ icon: Icon, title, text }) => (
            <Stack
              key={title}
              direction="row"
              spacing={2}
              sx={{ p: 2, borderRadius: 3, bgcolor: 'background.paper', color: 'text.primary', alignItems: 'center' }}
            >
              <SoftAvatar variant="rounded">
                <Icon size={20} />
              </SoftAvatar>
              <Box>
                <Typography variant="subtitle2">{title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {text}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Grid>
    </Grid>
  );
}
