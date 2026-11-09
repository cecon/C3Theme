// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Dot, StatusChip, StatusTone } from '@c3theme/ui';
import { SubscribeForm, ToolsArt, TopBar } from './shared';

const SERVICES: { name: string; status: string; tone: StatusTone }[] = [
  { name: 'Painel e relatórios', status: 'Em manutenção', tone: 'warning' },
  { name: 'Emissão de faturas', status: 'Em manutenção', tone: 'warning' },
  { name: 'Aplicativo do celular', status: 'Funcionando', tone: 'success' },
  { name: 'API para integrações', status: 'Instável', tone: 'danger' },
  { name: 'Site e página de pagamento', status: 'Funcionando', tone: 'success' }
];

const UPDATES = [
  { time: '21:40', text: 'Migração do banco de dados concluída. Começando os testes finais.' },
  { time: '20:15', text: 'Novos servidores ligados e sincronizando.' },
  { time: '19:00', text: 'Início da janela de manutenção programada.' }
];

/** Manutenção, versão 2: situação de cada serviço e linha do tempo das atualizações. */
export default function MaintenancePage2() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 12, md: 8 }
      }}
    >
      <TopBar />
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 4, md: 6 }} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <StatusChip label="Manutenção programada" tone="warning" />
            <Typography variant="h1" sx={{ mt: 2, fontSize: { xs: '2rem', sm: '2.75rem' } }}>
              Voltamos em breve, melhores.
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 520 }}>
              Estamos trocando os servidores para dar conta do crescimento. Alguns serviços estão fora do ar até as 23h (horário de
              Brasília). Deixe seu e-mail para saber assim que tudo voltar.
            </Typography>
            <Box sx={{ mt: 3 }}>
              <SubscribeForm cta="Avise-me" />
            </Box>
            <Box sx={{ mt: 4, display: { xs: 'none', md: 'block' } }}>
              <ToolsArt />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ px: 2.5, py: 2 }}>
                <Typography variant="h5">Situação dos serviços</Typography>
                <Typography variant="body2" color="text.secondary">
                  Atualizado automaticamente
                </Typography>
              </Box>
              <Divider />
              <Stack divider={<Divider />}>
                {SERVICES.map((s) => (
                  <Stack key={s.name} direction="row" sx={{ px: 2.5, py: 1.5, alignItems: 'center', gap: 1.5 }}>
                    <Dot tone={s.tone} />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {s.name}
                    </Typography>
                    <StatusChip label={s.status} tone={s.tone} />
                  </Stack>
                ))}
              </Stack>
              <Divider />
              <Box sx={{ px: 2.5, py: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                  Atualizações
                </Typography>
                <Stack spacing={2}>
                  {UPDATES.map((u, i) => (
                    <Stack key={u.time} direction="row" spacing={2}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ minWidth: 40, pt: 0.25, fontVariantNumeric: 'tabular-nums' }}
                      >
                        {u.time}
                      </Typography>
                      <Box sx={{ borderInlineStart: 2, borderColor: i === 0 ? 'primary.main' : 'divider', pl: 1.5 }}>
                        <Typography variant="body2">{u.text}</Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Box>
              <Divider />
              <Box sx={{ px: 2.5, py: 1.5 }}>
                <Button size="small" href="mailto:suporte@c3theme.dev">
                  Precisa de ajuda urgente? Fale com o suporte
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
