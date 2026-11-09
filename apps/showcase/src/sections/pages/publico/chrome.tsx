import { useState } from 'react';
import { Link as RouterLink } from 'react-router';

// material-ui
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

// third-party
import { HamburgerMenu, Instagram, Whatsapp, Youtube } from 'iconsax-reactjs';

import { ColorModeButton, Logo, notify } from '@c3theme/ui';

/** Links do topo: âncoras da landing (funcionam de outras páginas porque apontam para /paginas/landing#...). */
const NAV = [
  { label: 'Recursos', to: '/paginas/landing#recursos' },
  { label: 'Planos', to: '/paginas/landing#planos' },
  { label: 'Depoimentos', to: '/paginas/landing#depoimentos' },
  { label: 'Contato', to: '/paginas/fale-conosco' }
];

/** Topo das páginas públicas (landing, fale conosco). */
export function PublicHeader() {
  const [open, setOpen] = useState(false);
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={(theme) => ({
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: `rgb(${theme.vars.palette.background.defaultChannel} / 0.85)`,
        backdropFilter: 'blur(10px)'
      })}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 2, minHeight: { xs: 64 } }}>
          <Box component={RouterLink} to="/paginas/landing" sx={{ color: 'text.primary', textDecoration: 'none' }}>
            <Logo />
          </Box>
          <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' }, ml: 3 }}>
            {NAV.map((n) => (
              <Button key={n.label} component={RouterLink} to={n.to} color="inherit">
                {n.label}
              </Button>
            ))}
          </Stack>
          <Box sx={{ flex: 1 }} />
          <ColorModeButton />
          <Button component={RouterLink} to="/paginas/auth/login" color="inherit" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
            Entrar
          </Button>
          <Button
            component={RouterLink}
            to="/paginas/auth/cadastro"
            variant="contained"
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Teste grátis
          </Button>
          <IconButton aria-label="Abrir menu" onClick={() => setOpen(true)} sx={{ display: { md: 'none' } }}>
            <HamburgerMenu size={22} />
          </IconButton>
        </Toolbar>
      </Container>
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { sx: { width: 280 } } }}>
        <Box sx={{ p: 2 }}>
          <Logo />
        </Box>
        <Divider />
        <List>
          {NAV.map((n) => (
            <ListItemButton key={n.label} component={RouterLink} to={n.to} onClick={() => setOpen(false)}>
              <ListItemText primary={n.label} />
            </ListItemButton>
          ))}
        </List>
        <Stack spacing={1.5} sx={{ p: 2 }}>
          <Button component={RouterLink} to="/paginas/auth/login" variant="outlined">
            Entrar
          </Button>
          <Button component={RouterLink} to="/paginas/auth/cadastro" variant="contained">
            Teste grátis
          </Button>
        </Stack>
      </Drawer>
    </AppBar>
  );
}

const FOOTER_COLUMNS = [
  {
    title: 'Produto',
    links: [
      { label: 'Recursos', to: '/paginas/landing#recursos' },
      { label: 'Planos', to: '/paginas/precos' },
      { label: 'Novidades', to: '/paginas/em-breve' }
    ]
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Fale conosco', to: '/paginas/fale-conosco' },
      { label: 'Status dos serviços', to: '/paginas/manutencao-2' }
    ]
  },
  {
    title: 'Conta',
    links: [
      { label: 'Entrar', to: '/paginas/auth/login' },
      { label: 'Criar conta', to: '/paginas/auth/cadastro' },
      { label: 'Painel', to: '/dashboard/padrao' }
    ]
  }
];

/** Rodapé das páginas públicas. */
export function PublicFooter() {
  return (
    <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper', pt: 6, pb: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Logo />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 320 }}>
              Gestão financeira e de clientes para pequenas e médias empresas brasileiras.
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 2 }}>
              {[
                { icon: Instagram, label: 'Instagram' },
                { icon: Youtube, label: 'YouTube' },
                { icon: Whatsapp, label: 'WhatsApp' }
              ].map(({ icon: Icon, label }) => (
                <IconButton key={label} aria-label={label} onClick={() => notify(`Link do ${label} (simulação).`, 'info')}>
                  <Icon size={20} />
                </IconButton>
              ))}
            </Stack>
          </Grid>
          {FOOTER_COLUMNS.map((c) => (
            <Grid key={c.title} size={{ xs: 6, sm: 4, md: 'grow' }}>
              <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                {c.title}
              </Typography>
              <Stack spacing={1}>
                {c.links.map((l) => (
                  <Link key={l.label} component={RouterLink} to={l.to} color="text.secondary" underline="hover" variant="body2">
                    {l.label}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>
        <Divider sx={{ my: 4 }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            © 2026 C3 Vitrine. Dados e empresas fictícios.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Feito no Brasil · CNPJ 12.345.678/0001-90
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
