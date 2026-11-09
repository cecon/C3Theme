import { Link as RouterLink, Outlet } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { QuoteUp, TickCircle } from 'iconsax-reactjs';

import { ColorModeButton, Logo, LogoMark, SoftAvatar } from '@c3theme/ui';
import { AuthFooter } from './Estilo1';
import { AuthContext } from './fields';

// só o login tem versão própria; cadastro e recuperação usam as telas do estilo 1
const CONTEXT: AuthContext = { to: (s) => (s === 'login' ? '/paginas/auth3/login' : `/paginas/auth/${s}`) };

const POINTS = [
  'Faturas, clientes e equipe no mesmo lugar',
  'Relatórios prontos para o fechamento do mês',
  'Suporte em português, de verdade'
];

/** Estilo 3: tela dividida ao meio, com a marca de um lado e o formulário do outro. */
export default function AuthStyle3() {
  return (
    <Grid container sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Grid
        size={{ xs: 12, md: 6 }}
        sx={(theme) => ({
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { md: 6, lg: 8 },
          color: 'primary.contrastText',
          background: `linear-gradient(160deg, ${theme.vars.palette.primary.dark}, ${theme.vars.palette.primary.main})`,
          position: 'relative',
          overflow: 'hidden'
        })}
      >
        {/* círculos decorativos */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            width: 420,
            height: 420,
            borderRadius: '50%',
            border: 60,
            borderColor: 'currentColor',
            opacity: 0.06,
            top: -140,
            insetInlineEnd: -140
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            width: 260,
            height: 260,
            borderRadius: '50%',
            bgcolor: 'currentColor',
            opacity: 0.05,
            bottom: -80,
            insetInlineStart: -60
          }}
        />

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', position: 'relative' }}>
          <LogoMark size={40} />
          <Typography variant="h4" color="inherit">
            C3 Vitrine
          </Typography>
        </Stack>

        <Box sx={{ position: 'relative', maxWidth: 520 }}>
          <Typography variant="h1" color="inherit" sx={{ fontSize: { md: '2.5rem', lg: '3rem' }, lineHeight: 1.15 }}>
            Gestão que cabe no seu dia.
          </Typography>
          <Stack spacing={1.5} sx={{ mt: 4 }}>
            {POINTS.map((p) => (
              <Stack key={p} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <TickCircle size={22} variant="Bold" />
                <Typography color="inherit">{p}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Box
          sx={{ position: 'relative', p: 3, borderRadius: 3, bgcolor: 'color-mix(in srgb, currentColor 10%, transparent)', maxWidth: 520 }}
        >
          <QuoteUp size={28} variant="Bold" style={{ opacity: 0.6 }} />
          <Typography color="inherit" sx={{ mt: 1 }}>
            Fechamos o mês dois dias mais cedo desde que trocamos as planilhas pelo painel. A equipe inteira usa sem treinamento.
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 2 }}>
            <SoftAvatar size="sm" look="outlined" tone="neutral" sx={{ color: 'inherit' }}>
              JM
            </SoftAvatar>
            <Box>
              <Typography variant="subtitle2" color="inherit">
                Juliana Moreira
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Diretora financeira, Rede Sabor Mineiro
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column', p: { xs: 2, sm: 4 } }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Box component={RouterLink} to="/paginas/landing" sx={{ color: 'text.primary', textDecoration: 'none', display: { md: 'none' } }}>
            <Logo />
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <ColorModeButton />
          </Box>
        </Stack>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
          <Box sx={{ width: '100%', maxWidth: 420 }}>
            <Outlet context={CONTEXT} />
          </Box>
        </Box>
        <AuthFooter />
      </Grid>
    </Grid>
  );
}
