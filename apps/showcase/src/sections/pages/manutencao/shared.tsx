import { FormEvent, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { ColorModeButton, Logo, notify } from '@c3theme/ui';

/** Data de lançamento usada nas páginas "em breve". */
export const LAUNCH = new Date('2027-01-15T09:00:00-03:00');

export function useCountdown(target: Date) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
    done: diff === 0
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Contagem regressiva em caixas: dias, horas, minutos e segundos. */
export function Countdown({ target = LAUNCH, size = 'medium' }: { target?: Date; size?: 'medium' | 'large' }) {
  const c = useCountdown(target);
  const parts = [
    [c.days, 'dias'],
    [c.hours, 'horas'],
    [c.minutes, 'min'],
    [c.seconds, 'seg']
  ] as const;
  const big = size === 'large';
  return (
    <Stack
      direction="row"
      spacing={{ xs: 1, sm: 1.5 }}
      role="timer"
      aria-label={`Faltam ${c.days} dias, ${c.hours} horas e ${c.minutes} minutos`}
    >
      {parts.map(([value, label]) => (
        <Box
          key={label}
          sx={{
            minWidth: big ? { xs: 68, sm: 92 } : { xs: 64, sm: 76 },
            py: big ? 2 : 1.5,
            px: 1,
            borderRadius: 3,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            textAlign: 'center'
          }}
        >
          <Typography
            sx={{
              fontSize: big ? { xs: '1.75rem', sm: '2.5rem' } : { xs: '1.5rem', sm: '2rem' },
              fontWeight: 700,
              lineHeight: 1.1,
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {label === 'dias' ? value : pad(value)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Inscrição por e-mail para ser avisado (simulada). */
export function SubscribeForm({ cta = 'Me avise' }: { cta?: string }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) return setError('Informe um e-mail válido.');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setDone(true);
    notify(`Pronto! Avisaremos ${email.trim()} assim que estiver no ar.`);
  };

  if (done)
    return (
      <Typography color="success.main" sx={{ fontWeight: 500 }} role="status">
        Inscrição confirmada. Até breve!
      </Typography>
    );

  return (
    <Stack
      component="form"
      onSubmit={submit}
      noValidate
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      sx={{ width: '100%', maxWidth: 460 }}
    >
      <TextField
        type="email"
        placeholder="seu@email.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError(undefined);
        }}
        error={!!error}
        helperText={error}
        fullWidth
        slotProps={{ htmlInput: { 'aria-label': 'Seu e-mail' } }}
      />
      <Button type="submit" variant="contained" size="large" loading={loading} sx={{ flexShrink: 0, height: 52 }}>
        {cta}
      </Button>
    </Stack>
  );
}

/** Faixa com a marca e o botão de tema, no topo das páginas fora do layout. */
export function TopBar() {
  return (
    <Stack
      direction="row"
      sx={{
        position: 'absolute',
        top: 0,
        insetInline: 0,
        px: { xs: 2, sm: 4 },
        py: 2,
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1
      }}
    >
      <Box component={RouterLink} to="/dashboard/padrao" sx={{ color: 'text.primary', textDecoration: 'none' }}>
        <Logo />
      </Box>
      <ColorModeButton />
    </Stack>
  );
}

// ---------------------------------------------------------------- ilustrações (desenhadas aqui, nas cores do tema)

// furos e textos sobre a cor cheia usam o fundo do papel (claro ou escuro)
const HOLE = { fill: 'var(--mui-palette-background-paper)' };

const artSx = { width: { xs: 220, sm: 280 }, height: 'auto', color: 'primary.main' } as const;

/** Mapa dobrado com um ponto de interrogação: página que não existe. */
export function LostArt() {
  return (
    <Box component="svg" viewBox="0 0 240 160" aria-hidden sx={artSx}>
      <ellipse cx="120" cy="148" rx="90" ry="8" fill="currentColor" opacity="0.1" />
      <path d="M40 30 L90 18 L150 34 L200 22 L200 128 L150 140 L90 124 L40 136 Z" fill="currentColor" opacity="0.12" />
      <path d="M90 18 L90 124 M150 34 L150 140" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
      <path
        d="M58 104 C 80 90, 98 112, 120 92 S 160 70, 182 84"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="6 6"
        strokeLinecap="round"
      />
      <circle cx="182" cy="84" r="7" fill="currentColor" />
      <circle cx="120" cy="62" r="26" fill="currentColor" />
      <text x="120" y="72" textAnchor="middle" fontSize="30" fontWeight="700" style={HOLE} fontFamily="inherit">
        ?
      </text>
    </Box>
  );
}

/** Tomada desconectada: erro no servidor. */
export function UnpluggedArt() {
  return (
    <Box component="svg" viewBox="0 0 240 160" aria-hidden sx={{ ...artSx, color: 'error.main' }}>
      <ellipse cx="120" cy="148" rx="90" ry="8" fill="currentColor" opacity="0.1" />
      <path d="M10 80 H70" stroke="currentColor" strokeOpacity="0.4" strokeWidth="6" strokeLinecap="round" />
      <rect x="66" y="58" width="36" height="44" rx="8" fill="currentColor" />
      <path d="M102 70 H118 M102 90 H118" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <path d="M230 80 H170" stroke="currentColor" strokeOpacity="0.4" strokeWidth="6" strokeLinecap="round" />
      <rect x="138" y="58" width="36" height="44" rx="8" fill="currentColor" opacity="0.6" />
      <circle cx="148" cy="70" r="3.5" style={HOLE} />
      <circle cx="148" cy="90" r="3.5" style={HOLE} />
      <path
        d="M124 40 L130 54 M120 120 L126 106 M112 44 L120 56"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
    </Box>
  );
}

/** Engrenagens e chave: manutenção. */
export function ToolsArt() {
  const teeth = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <Box component="svg" viewBox="0 0 240 160" aria-hidden sx={artSx}>
      <ellipse cx="120" cy="148" rx="90" ry="8" fill="currentColor" opacity="0.1" />
      <g transform="translate(100 78)">
        <g style={{ transformOrigin: 'center', animation: 'c3spin 8s linear infinite' }}>
          {teeth.map((a) => (
            <rect key={a} x="-7" y="-50" width="14" height="18" rx="3" fill="currentColor" transform={`rotate(${a})`} />
          ))}
          <circle r="38" fill="currentColor" />
          <circle r="15" style={HOLE} />
        </g>
      </g>
      <g transform="translate(170 52)">
        <g style={{ transformOrigin: 'center', animation: 'c3spin 6s linear infinite reverse' }}>
          {teeth.map((a) => (
            <rect key={a} x="-4.5" y="-30" width="9" height="11" rx="2" fill="currentColor" opacity="0.55" transform={`rotate(${a})`} />
          ))}
          <circle r="22" fill="currentColor" opacity="0.55" />
          <circle r="8" style={HOLE} />
        </g>
      </g>
      <style>
        {
          '@keyframes c3spin { to { transform: rotate(360deg); } } @media (prefers-reduced-motion: reduce) { g { animation: none !important; } }'
        }
      </style>
    </Box>
  );
}

/** Calendário com estrela: lançamento em breve. */
export function LaunchArt() {
  return (
    <Box component="svg" viewBox="0 0 240 160" aria-hidden sx={artSx}>
      <ellipse cx="120" cy="148" rx="90" ry="8" fill="currentColor" opacity="0.1" />
      <rect x="62" y="30" width="116" height="104" rx="14" fill="currentColor" opacity="0.14" />
      <path d="M62 44 a14 14 0 0 1 14 -14 h88 a14 14 0 0 1 14 14 v14 h-116 Z" fill="currentColor" />
      <rect x="86" y="20" width="8" height="22" rx="4" fill="currentColor" opacity="0.7" />
      <rect x="146" y="20" width="8" height="22" rx="4" fill="currentColor" opacity="0.7" />
      {[0, 1, 2, 3].map((c) =>
        [0, 1].map((r) => (
          <rect
            key={`${c}-${r}`}
            x={78 + c * 22}
            y={72 + r * 24}
            width="14"
            height="14"
            rx="3"
            fill="currentColor"
            opacity={c === 2 && r === 1 ? 1 : 0.3}
          />
        ))
      )}
      <path d="M198 26 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1 Z" fill="currentColor" opacity="0.8" />
    </Box>
  );
}
