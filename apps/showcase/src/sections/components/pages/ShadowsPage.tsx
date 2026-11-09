// material-ui
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTheme, type Theme } from '@mui/material/styles';

import Example, { ExamplePage } from '../Example';

const COLORS = [
  { key: 'primary', label: 'Primária' },
  { key: 'secondary', label: 'Secundária' },
  { key: 'success', label: 'Sucesso' },
  { key: 'warning', label: 'Atenção' },
  { key: 'error', label: 'Erro' },
  { key: 'info', label: 'Informação' }
] as const;

// sombras de uso comum na C3, montadas com o canal da cor do texto para funcionar nos dois modos
const CUSTOM: { name: string; use: string; shadow: (t: Theme) => string }[] = [
  { name: 'Sutil', use: 'Cartões no modo de contraste', shadow: () => '0 1px 2px rgb(16 24 40 / 0.06), 0 4px 12px rgb(16 24 40 / 0.06)' },
  { name: 'Flutuante', use: 'Menus e listas suspensas', shadow: () => '0 8px 24px rgb(16 24 40 / 0.12)' },
  { name: 'Diálogo', use: 'Janelas sobre a página', shadow: () => '0 24px 48px rgb(16 24 40 / 0.18)' },
  { name: 'Anel de foco', use: 'Campos e botões focados', shadow: (t) => `0 0 0 3px rgb(${t.vars.palette.primary.mainChannel} / 0.25)` },
  { name: 'Interna', use: 'Áreas rebaixadas', shadow: () => 'inset 0 2px 6px rgb(16 24 40 / 0.12)' }
];

const grid = {
  display: 'grid',
  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(6, 1fr)' },
  gap: 3
} as const;

function Tile({ title, subtitle, shadow }: { title: string; subtitle?: string; shadow: string | ((t: Theme) => string) }) {
  return (
    <Paper
      sx={(t) => ({
        p: 2,
        minHeight: 88,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        borderRadius: 2,
        boxShadow: typeof shadow === 'function' ? shadow(t) : shadow
      })}
    >
      <Typography variant="subtitle2">{title}</Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
}

export default function ShadowsPage() {
  const theme = useTheme();
  return (
    <ExamplePage intro="Sombras dão profundidade. O tema C3 usa bordas finas por padrão e reserva as sombras para o que flutua: menus, diálogos e o modo de contraste. No modo escuro, prefira bordas.">
      <Example
        title="Escala do tema"
        description="theme.shadows de 0 a 24 (o número da elevação)."
        code={`<Paper elevation={4} />
<Box sx={{ boxShadow: 8 }} />`}
        wide
      >
        <Box sx={grid}>
          {theme.shadows.map((s, i) => (
            <Tile key={i} title={`boxShadow: ${i}`} shadow={s} />
          ))}
        </Box>
      </Example>

      <Example
        title="Sombras coloridas"
        description="Feitas com o canal da cor, então seguem a cor de marca."
        code={`sx={(t) => ({ boxShadow: \`0 8px 24px rgb(\${t.vars.palette.primary.mainChannel} / 0.3)\` })}`}
        wide
      >
        <Box sx={grid}>
          {COLORS.map(({ key, label }) => (
            <Tile
              key={key}
              title={label}
              subtitle={`${key}.main`}
              shadow={(t) => `0 8px 24px rgb(${t.vars.palette[key].mainChannel} / 0.32)`}
            />
          ))}
        </Box>
      </Example>

      <Example
        title="Sombras de uso"
        description="Combinações prontas para casos comuns."
        code={`boxShadow: '0 8px 24px rgb(16 24 40 / 0.12)'   // menus
boxShadow: (t) => \`0 0 0 3px rgb(\${t.vars.palette.primary.mainChannel} / 0.25)\`   // foco`}
        wide
      >
        <Box sx={{ ...grid, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' } }}>
          {CUSTOM.map((c) => (
            <Tile key={c.name} title={c.name} subtitle={c.use} shadow={c.shadow} />
          ))}
        </Box>
      </Example>
    </ExamplePage>
  );
}
