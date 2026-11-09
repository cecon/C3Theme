import { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ArrowRight, TickCircle, Profile2User, Flash } from 'iconsax-reactjs';
import { SoftAvatar, StatusChip } from '@c3theme/ui';
import BillingToggle from '../precos/BillingToggle';
import PlanCards from '../precos/PlanCards';
import { Billing } from '../precos/planos';
import { PublicFooter, PublicHeader } from './chrome';
import { FEATURES, NUMBERS, TESTIMONIALS } from './landing/content';
import { ProductPreview } from './landing/ProductPreview';
import { SectionTitle } from './landing/SectionTitle';

const sectionSx = { py: { xs: 8, md: 12 }, scrollMarginTop: 64 };

export default function LandingPage() {
  const { hash } = useLocation();
  const [billing, setBilling] = useState<Billing>('mensal');

  // âncoras do menu: rola até a seção quando a URL tem #
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <PublicHeader />

      {/* hero */}
      <Box
        component="section"
        sx={(theme) => ({
          pt: { xs: 6, md: 10 },
          pb: { xs: 8, md: 12 },
          backgroundImage: `radial-gradient(ellipse at top, rgb(${theme.vars.palette.primary.mainChannel} / 0.14), transparent 60%)`
        })}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 6, md: 8 }} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <StatusChip label="Novo: cobrança por Pix automática" tone="primary" />
              <Typography variant="h1" sx={{ fontSize: { xs: '2.25rem', sm: '3rem', md: '3.5rem' }, lineHeight: 1.1, mt: 2.5 }}>
                As finanças da sua empresa,{' '}
                <Box component="span" sx={{ color: 'primary.main' }}>
                  sem planilha.
                </Box>
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 2.5, fontSize: '1.125rem', maxWidth: 520 }}>
                Emita faturas, cobre no automático e saiba quanto vai entrar no mês. Tudo num painel simples, feito para quem tem mais o que
                fazer.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
                <Button
                  component={RouterLink}
                  to="/paginas/auth/cadastro"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowRight size={18} />}
                >
                  Começar 14 dias grátis
                </Button>
                <Button component={RouterLink} to="/dashboard/padrao" variant="outlined" size="large">
                  Ver o painel
                </Button>
              </Stack>
              <Stack direction="row" sx={{ mt: 3, gap: 2.5, flexWrap: 'wrap', color: 'text.secondary' }}>
                {['Sem cartão de crédito', 'Cancele quando quiser'].map((t) => (
                  <Stack key={t} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                    <TickCircle size={16} variant="Bold" />
                    <Typography variant="body2">{t}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ProductPreview />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* recursos */}
      <Box component="section" id="recursos" sx={sectionSx}>
        <Container maxWidth="lg">
          <SectionTitle
            overline="Recursos"
            title="O que você precisa, sem o que não usa"
            text="Seis ferramentas que resolvem o dia a dia financeiro de uma empresa pequena."
          />
          <Grid container spacing={3}>
            {FEATURES.map(({ icon: Icon, tone, title, text }) => (
              <Grid key={title} size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 3, borderRadius: 3, height: '100%', transition: 'transform .2s', '&:hover': { transform: 'translateY(-4px)' } }}
                >
                  <SoftAvatar tone={tone} variant="rounded" size="lg">
                    <Icon size={26} variant="Bulk" />
                  </SoftAvatar>
                  <Typography variant="h5" sx={{ mt: 2.5 }}>
                    {title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {text}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* números */}
      <Box component="section" id="numeros" sx={{ py: { xs: 6, md: 8 }, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {NUMBERS.map(([n, l]) => (
              <Grid key={l} size={{ xs: 6, md: 3 }} sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: { xs: '2rem', md: '2.75rem' }, fontWeight: 700, lineHeight: 1.1 }}>{n}</Typography>
                <Typography sx={{ opacity: 0.85, mt: 0.5 }}>{l}</Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* depoimentos */}
      <Box component="section" id="depoimentos" sx={sectionSx}>
        <Container maxWidth="lg">
          <SectionTitle overline="Depoimentos" title="Quem usa, recomenda" />
          <Grid container spacing={3}>
            {TESTIMONIALS.map((t) => (
              <Grid key={t.name} size={{ xs: 12, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Rating value={5} readOnly size="small" aria-label="5 de 5 estrelas" />
                  <Typography sx={{ mt: 2, flex: 1 }}>“{t.text}”</Typography>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 3 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', width: 40, height: 40, fontSize: 16 }}>
                      {t.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">{t.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.role}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* planos */}
      <Box component="section" id="planos" sx={{ ...sectionSx, bgcolor: 'background.paper', borderBlock: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <SectionTitle
            overline="Planos"
            title="Preço justo, sem surpresa"
            text="Todos os planos com 14 dias grátis. Troque ou cancele quando quiser."
          />
          <Box sx={{ mb: 4 }}>
            <BillingToggle value={billing} onChange={setBilling} />
          </Box>
          <PlanCards billing={billing} />
        </Container>
      </Box>

      {/* chamada final */}
      <Box component="section" sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="md">
          <Paper
            sx={(theme) => ({
              p: { xs: 4, md: 6 },
              borderRadius: 4,
              textAlign: 'center',
              color: 'primary.contrastText',
              background: `linear-gradient(135deg, ${theme.vars.palette.primary.main}, ${theme.vars.palette.primary.dark})`
            })}
          >
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', mb: 2 }}>
              <Flash size={28} variant="Bold" />
              <Profile2User size={28} variant="Bold" />
            </Stack>
            <Typography variant="h2" color="inherit" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
              Pronto para fechar o mês sem dor de cabeça?
            </Typography>
            <Typography sx={{ mt: 1.5, opacity: 0.9 }}>Crie sua conta em 2 minutos. A gente ajuda a importar seus clientes.</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'center', mt: 4 }}>
              <Button
                component={RouterLink}
                to="/paginas/auth/cadastro"
                variant="contained"
                size="large"
                sx={{ bgcolor: 'background.paper', color: 'primary.main', '&:hover': { bgcolor: 'background.default' } }}
              >
                Criar conta grátis
              </Button>
              <Button component={RouterLink} to="/paginas/fale-conosco" size="large" variant="outlined" color="inherit">
                Falar com vendas
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>

      <PublicFooter />
    </Box>
  );
}
