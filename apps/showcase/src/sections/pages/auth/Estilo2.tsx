import { useEffect, useState } from 'react';
import { Link as RouterLink, Outlet } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { ColorModeButton, Logo } from '@c3theme/ui';
import { AuthFooter } from './Estilo1';
import { linksFor } from './fields';

const CONTEXT = linksFor('/paginas/auth2');

const MESSAGES = [
  { title: 'Tudo da empresa em um só lugar', text: 'Vendas, faturas, clientes e equipe no mesmo painel, do computador ou do celular.' },
  { title: 'Cobranças sem planilha', text: 'Emita faturas, acompanhe quem pagou e envie lembretes automáticos de vencimento.' },
  { title: 'Seus dados protegidos', text: 'Verificação em duas etapas, controle de sessões e papéis por pessoa da equipe.' }
];

/** Ilustração própria: um painel estilizado, desenhado com a cor do texto do painel lateral. */
function Illustration() {
  return (
    <Box component="svg" viewBox="0 0 320 220" aria-hidden sx={{ width: '100%', maxWidth: 360, height: 'auto', color: 'inherit' }}>
      <rect x="10" y="10" width="300" height="200" rx="16" fill="currentColor" opacity="0.12" />
      <rect x="26" y="26" width="90" height="10" rx="5" fill="currentColor" opacity="0.5" />
      <rect x="26" y="44" width="56" height="8" rx="4" fill="currentColor" opacity="0.3" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${26 + i * 94} 66)`}>
          <rect width="82" height="48" rx="10" fill="currentColor" opacity="0.16" />
          <rect x="10" y="12" width="36" height="6" rx="3" fill="currentColor" opacity="0.45" />
          <rect x="10" y="26" width="52" height="10" rx="5" fill="currentColor" opacity="0.8" />
        </g>
      ))}
      <rect x="26" y="126" width="176" height="70" rx="10" fill="currentColor" opacity="0.16" />
      {[30, 46, 38, 58, 50, 64, 54].map((h, i) => (
        <rect key={i} x={40 + i * 22} y={186 - h} width="12" height={h} rx="4" fill="currentColor" opacity={i === 5 ? 0.95 : 0.55} />
      ))}
      <rect x="214" y="126" width="80" height="70" rx="10" fill="currentColor" opacity="0.16" />
      <circle cx="254" cy="161" r="22" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="8" />
      <circle
        cx="254"
        cy="161"
        r="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeDasharray="96 200"
        strokeLinecap="round"
        transform="rotate(-90 254 161)"
      />
    </Box>
  );
}

/** Mensagens que trocam sozinhas (pausam com o mouse em cima) e pontos para escolher. */
function MessageCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), 5000);
    return () => clearInterval(t);
  }, [paused]);
  const msg = MESSAGES[index]!;
  return (
    <Box onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} sx={{ textAlign: 'center', maxWidth: 380 }}>
      <Box aria-live="polite" sx={{ minHeight: 112 }}>
        <Typography
          key={msg.title}
          variant="h4"
          color="inherit"
          sx={{ animation: 'c3fade .4s ease', '@keyframes c3fade': { from: { opacity: 0 } } }}
        >
          {msg.title}
        </Typography>
        <Typography key={msg.text} sx={{ mt: 1, opacity: 0.85, animation: 'c3fade .4s ease' }}>
          {msg.text}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', mt: 2 }}>
        {MESSAGES.map((m, i) => (
          <ButtonBase
            key={m.title}
            aria-label={`Mensagem ${i + 1} de ${MESSAGES.length}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            sx={{
              width: i === index ? 24 : 8,
              height: 8,
              borderRadius: 4,
              bgcolor: 'currentColor',
              opacity: i === index ? 1 : 0.4,
              transition: 'all .25s'
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

/** Estilo 2: cartão largo com painel ilustrado e mensagens que trocam ao lado do formulário. */
export default function AuthStyle2() {
  return (
    <Box
      sx={(theme) => ({
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: { xs: 2, sm: 3 },
        bgcolor: 'background.default',
        backgroundImage: `radial-gradient(circle at 15% 20%, rgb(${theme.vars.palette.primary.mainChannel} / 0.12), transparent 40%), radial-gradient(circle at 85% 80%, rgb(${theme.vars.palette.secondary.mainChannel} / 0.12), transparent 40%)`
      })}
    >
      <Paper
        variant="outlined"
        sx={{ width: '100%', maxWidth: 1040, borderRadius: 4, overflow: 'hidden', display: 'flex', minHeight: { md: 620 } }}
      >
        <Stack
          sx={{
            display: { xs: 'none', md: 'flex' },
            flex: '0 0 46%',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            p: 5,
            color: 'primary.contrastText',
            bgcolor: 'primary.main'
          }}
        >
          <Illustration />
          <MessageCarousel />
        </Stack>
        <Stack sx={{ flex: 1, p: { xs: 3, sm: 5 }, justifyContent: 'center' }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box component={RouterLink} to="/paginas/landing" sx={{ color: 'text.primary', textDecoration: 'none' }}>
              <Logo />
            </Box>
            <ColorModeButton />
          </Stack>
          <Box sx={{ width: '100%', maxWidth: 440, mx: 'auto' }}>
            <Outlet context={CONTEXT} />
          </Box>
        </Stack>
      </Paper>
      <AuthFooter />
    </Box>
  );
}
