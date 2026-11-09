// material-ui
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useColorScheme, useTheme, type Palette } from '@mui/material/styles';

// third-party
import { TickCircle } from 'iconsax-reactjs';

import { BRAND_COLORS, notify, softColors, useUiConfig, type BrandColor, type Tone } from '@c3theme/ui';
import Example, { ExamplePage } from '../Example';

const MAIN_COLORS = [
  { key: 'primary', label: 'Primária', use: 'Ações principais, links e destaques. Vem da cor de marca.' },
  { key: 'secondary', label: 'Secundária', use: 'Elementos neutros e ações de menor peso.' },
  { key: 'success', label: 'Sucesso', use: 'Confirmações, valores positivos, situação ativa.' },
  { key: 'warning', label: 'Atenção', use: 'Pendências e alertas que pedem cuidado.' },
  { key: 'error', label: 'Erro', use: 'Falhas, exclusões e valores negativos.' },
  { key: 'info', label: 'Informação', use: 'Mensagens neutras e dicas.' }
] as const;

type MainKey = (typeof MAIN_COLORS)[number]['key'];
const SHADES = ['light', 'main', 'dark', 'contrastText'] as const;

const BRAND_LABEL: Record<BrandColor, string> = {
  blue: 'Azul',
  teal: 'Verde-azulado',
  violet: 'Violeta',
  orange: 'Laranja',
  graphite: 'Grafite',
  indigo: 'Índigo',
  green: 'Verde',
  rose: 'Rosa',
  cyan: 'Ciano'
};

const TONE_OF: Record<MainKey, Tone> = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  warning: 'warning',
  error: 'danger',
  info: 'info'
};

/** Converte `rgb(r, g, b)` (como o MUI guarda light/dark) para #RRGGBB; o resto passa direto. */
function toHex(value: string) {
  const m = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(value);
  if (!m) return value;
  return (
    '#' +
    m
      .slice(1)
      .map((n) => Number(n).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    notify(`${value} copiado.`, 'info');
  } catch {
    notify('Não foi possível copiar.', 'error');
  }
}

/** Paleta do modo atual (claro ou escuro) com os valores resolvidos. */
function usePalette(): Palette {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  return theme.colorSchemes[colorScheme ?? 'light']?.palette ?? theme.palette;
}

function Swatch({ label, value, bg, fg, tall }: { label: string; value: string; bg: string; fg: string; tall?: boolean }) {
  return (
    <ButtonBase
      onClick={() => copy(value)}
      aria-label={`Copiar ${label}: ${value}`}
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        textAlign: 'start',
        p: 1.25,
        minHeight: tall ? 96 : 64,
        bgcolor: bg,
        color: fg,
        borderRadius: 1.5,
        border: 1,
        borderColor: 'divider'
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'inherit' }}>
        {label}
      </Typography>
      <Typography variant="caption" sx={{ fontFamily: 'ui-monospace, monospace', color: 'inherit', opacity: 0.85 }}>
        {value}
      </Typography>
    </ButtonBase>
  );
}

function MainColor({ k, label, use }: { k: MainKey; label: string; use: string }) {
  const theme = useTheme();
  const palette = usePalette();
  const vars = theme.vars.palette[k];
  return (
    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
      <Stack spacing={1}>
        <Box>
          <Typography variant="subtitle1">{label}</Typography>
          <Typography variant="caption" color="text.secondary">
            {use}
          </Typography>
        </Box>
        <Swatch label={`${k}.main`} value={toHex(palette[k].main)} bg={vars.main} fg={vars.contrastText} tall />
        <Grid container spacing={1}>
          {SHADES.filter((s) => s !== 'main').map((s) => (
            <Grid key={s} size={4}>
              <Swatch
                label={s === 'contrastText' ? 'contraste' : s}
                value={toHex(palette[k][s])}
                bg={s === 'contrastText' ? vars.contrastText : vars[s]}
                fg={s === 'contrastText' ? vars.main : vars.contrastText}
              />
            </Grid>
          ))}
        </Grid>
        <Box sx={(t) => ({ ...softColors(t, TONE_OF[k]), borderRadius: 1.5, px: 1.25, py: 1 })}>
          <Typography variant="caption" sx={{ color: 'inherit', fontWeight: 600 }}>
            Suave (softColors '{TONE_OF[k]}')
          </Typography>
        </Box>
      </Stack>
    </Grid>
  );
}

function Neutrals() {
  const theme = useTheme();
  const palette = usePalette();
  const v = theme.vars.palette;
  const items = [
    { label: 'text.primary', value: palette.text.primary, bg: v.text.primary, fg: v.background.paper },
    { label: 'text.secondary', value: palette.text.secondary, bg: v.text.secondary, fg: v.background.paper },
    { label: 'text.disabled', value: palette.text.disabled, bg: v.text.disabled, fg: v.background.paper },
    { label: 'background.default', value: palette.background.default, bg: v.background.default, fg: v.text.primary },
    { label: 'background.paper', value: palette.background.paper, bg: v.background.paper, fg: v.text.primary },
    { label: 'divider', value: palette.divider, bg: v.divider, fg: v.text.primary },
    { label: 'action.hover', value: palette.action.hover, bg: v.action.hover, fg: v.text.primary },
    { label: 'action.selected', value: palette.action.selected, bg: v.action.selected, fg: v.text.primary }
  ];
  return (
    <Grid container spacing={1}>
      {items.map((i) => (
        <Grid key={i.label} size={{ xs: 6, sm: 3 }}>
          <Swatch {...i} />
        </Grid>
      ))}
    </Grid>
  );
}

function Greys() {
  const theme = useTheme();
  const palette = usePalette();
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(5, 1fr)', md: 'repeat(10, 1fr)' }, gap: 1 }}>
      {steps.map((s) => (
        <Swatch
          key={s}
          label={String(s)}
          value={palette.grey[s]}
          bg={theme.vars.palette.grey[s]}
          fg={s >= 500 ? theme.vars.palette.common.white : theme.vars.palette.common.black}
        />
      ))}
    </Box>
  );
}

function Brands() {
  const { config, setConfig } = useUiConfig();
  const { colorScheme } = useColorScheme();
  const mode = colorScheme === 'dark' ? 'dark' : 'light';
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)', lg: 'repeat(9, 1fr)' },
        gap: 1.5
      }}
    >
      {(Object.keys(BRAND_COLORS) as BrandColor[]).map((brand) => {
        const c = BRAND_COLORS[brand];
        const active = config.brand === brand;
        return (
          <ButtonBase
            key={brand}
            onClick={() => {
              setConfig({ brand });
              notify(`Cor de marca: ${BRAND_LABEL[brand]}.`, 'info');
            }}
            aria-pressed={active}
            aria-label={`Usar a cor ${BRAND_LABEL[brand]}`}
            sx={{
              width: '100%',
              display: 'block',
              textAlign: 'start',
              borderRadius: 2,
              border: 2,
              borderColor: active ? 'primary.main' : 'divider',
              overflow: 'hidden'
            }}
          >
            {/* aqui a cor é o próprio dado mostrado, por isso o valor direto */}
            <Box sx={{ display: 'flex', height: 56 }}>
              <Box sx={{ flex: 1, bgcolor: c.light, display: 'grid', placeItems: 'center', color: 'common.white' }}>
                {active && mode === 'light' && <TickCircle size={22} variant="Bold" />}
              </Box>
              <Box sx={{ flex: 1, bgcolor: c.dark, display: 'grid', placeItems: 'center', color: 'common.black' }}>
                {active && mode === 'dark' && <TickCircle size={22} variant="Bold" />}
              </Box>
            </Box>
            <Box sx={{ px: 1.25, py: 1 }}>
              <Typography variant="subtitle2">{BRAND_LABEL[brand]}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'ui-monospace, monospace', display: 'block' }}>
                {c.light}
                <br />
                {c.dark}
              </Typography>
            </Box>
          </ButtonBase>
        );
      })}
    </Box>
  );
}

export default function ColorsPage() {
  const { colorScheme } = useColorScheme();
  return (
    <ExamplePage
      intro={`Cores do tema no modo ${colorScheme === 'dark' ? 'escuro' : 'claro'}, lidas do próprio tema: mude a cor de marca no painel de aparência (ou abaixo) e o modo claro/escuro para ver tudo mudar. Clique numa amostra para copiar o valor.`}
    >
      <Example
        title="Paleta principal"
        description="main, light, dark e contraste de cada cor."
        code={`sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
sx={(theme) => ({ borderColor: theme.vars.palette.error.main })}
sx={(theme) => softColors(theme, 'success')}  // fundo suave + texto legível`}
        wide
      >
        <Grid container spacing={3}>
          {MAIN_COLORS.map((c) => (
            <MainColor key={c.key} k={c.key} label={c.label} use={c.use} />
          ))}
        </Grid>
      </Example>

      <Example
        title="Cores de marca (BRAND_COLORS)"
        description="As 9 opções do painel de aparência, com o valor no claro e no escuro. Clique para aplicar."
        code={`import { BRAND_COLORS, useUiConfig } from '@c3theme/ui';
const { setConfig } = useUiConfig();
setConfig({ brand: 'teal' });`}
        wide
      >
        <Brands />
      </Example>

      <Example
        title="Texto, fundo e ações"
        code={`color: 'text.secondary'
bgcolor: 'background.default'
borderColor: 'divider'`}
        wide
      >
        <Neutrals />
      </Example>

      <Example title="Cinzas" code={`bgcolor: 'grey.100'`} wide>
        <Greys />
      </Example>
    </ExamplePage>
  );
}
