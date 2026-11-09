// Prévia do produto no hero.
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { SoftAvatar, StatusChip } from '@c3theme/ui';

/** Prévia do produto no hero: um mini painel desenhado com componentes de verdade. */
export function ProductPreview() {
  const { palette } = useTheme();
  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 4, p: { xs: 2, sm: 3 }, boxShadow: (t) => `0 24px 60px -24px rgb(${t.vars.palette.primary.mainChannel} / 0.45)` }}
    >
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">Resumo de outubro</Typography>
        <StatusChip label="+18% no mês" tone="success" />
      </Stack>
      <Grid container spacing={1.5}>
        {[
          ['Recebido', 'R$ 57.300', 'success'],
          ['A receber', 'R$ 21.840', 'warning'],
          ['Vencido', 'R$ 3.120', 'danger']
        ].map(([label, value, tone]) => (
          <Grid key={label} size={4}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{ color: `${tone === 'danger' ? 'error' : tone}.main`, fontSize: { xs: '0.8rem', sm: '0.95rem' } }}
              >
                {value}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ mt: 2, '& .MuiLineChart-area': { fillOpacity: 0.18 } }}>
        <SparkLineChart data={[31, 35, 42, 47, 45, 52, 58, 55, 61, 66]} height={110} area curve="natural" color={palette.primary.main} />
      </Box>
      <Stack spacing={1} sx={{ mt: 2 }}>
        {[
          ['Padaria Pão de Mel', 'R$ 1.780,00', 'Paga', 'success'],
          ['Construtora Horizonte', 'R$ 4.690,00', 'Pendente', 'warning']
        ].map(([name, value, status, tone]) => (
          <Stack key={name} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <SoftAvatar size="sm" tone="neutral">
              {name[0]}
            </SoftAvatar>
            <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
              {name}
            </Typography>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {value}
            </Typography>
            <StatusChip label={status!} tone={tone as 'success' | 'warning'} />
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
