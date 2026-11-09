import { Link as RouterLink } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import { Chart21, PresentionChart, TrendUp } from 'iconsax-reactjs';

import { WELCOME } from './data';

/** Faixa de boas-vindas no topo do painel, com o resumo do dia e atalhos. */
export default function WelcomeBanner() {
  return (
    <Paper
      sx={(theme) => ({
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        p: { xs: 3, md: 4 },
        color: theme.vars.palette.primary.contrastText,
        bgcolor: theme.vars.palette.primary.dark,
        backgroundImage: `linear-gradient(120deg, ${theme.vars.palette.primary.dark} 0%, ${theme.vars.palette.primary.main} 100%)`,
        ...theme.applyStyles('dark', {
          color: theme.vars.palette.text.primary,
          backgroundImage: `linear-gradient(120deg, rgb(${theme.vars.palette.primary.mainChannel} / 0.35) 0%, rgb(${theme.vars.palette.primary.mainChannel} / 0.12) 100%)`
        })
      })}
    >
      {/* formas decorativas */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          insetInlineEnd: -60,
          top: -80,
          width: 280,
          height: 280,
          borderRadius: '50%',
          bgcolor: 'rgb(255 255 255 / 0.08)'
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          insetInlineEnd: 120,
          bottom: -110,
          width: 220,
          height: 220,
          borderRadius: '50%',
          bgcolor: 'rgb(255 255 255 / 0.06)'
        }}
      />
      <Stack direction="row" sx={{ position: 'relative', alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
        <Box sx={{ maxWidth: 560 }}>
          <Typography variant="h2" component="p" sx={{ color: 'inherit' }}>
            Bom dia, {WELCOME.name}!
          </Typography>
          <Typography variant="body1" sx={{ color: 'inherit', opacity: 0.88, mt: 1 }}>
            Hoje já entraram {WELCOME.ordersToday} pedidos e há {WELCOME.pendingApprovals} aprovações esperando por você. As vendas do mês
            estão 12% acima da meta.
          </Typography>
          <Stack direction="row" sx={{ mt: 3, gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              component={RouterLink}
              to="/dashboard/analitico"
              variant="contained"
              color="inherit"
              startIcon={<PresentionChart size={18} />}
              sx={{ color: 'primary.dark', bgcolor: 'common.white', '&:hover': { bgcolor: 'grey.100' } }}
            >
              Ver análise completa
            </Button>
            <Button
              component={RouterLink}
              to="/widgets/graficos"
              variant="outlined"
              color="inherit"
              startIcon={<Chart21 size={18} />}
              sx={{ borderColor: 'currentColor' }}
            >
              Relatórios
            </Button>
          </Stack>
        </Box>
        <Box
          aria-hidden
          sx={{
            display: { xs: 'none', sm: 'grid' },
            placeItems: 'center',
            width: 150,
            height: 150,
            flexShrink: 0,
            borderRadius: 4,
            bgcolor: 'rgb(255 255 255 / 0.14)',
            mr: { md: 4 }
          }}
        >
          <TrendUp size={84} variant="Bulk" />
        </Box>
      </Stack>
    </Paper>
  );
}
