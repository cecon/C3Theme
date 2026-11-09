import type { Meta, StoryObj } from '@storybook/react-vite';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { Panel, softColors } from '@c3theme/ui';
import { TONES } from '../support/tones';

const PALETTE = ['primary', 'secondary', 'info', 'success', 'warning', 'error'] as const;
const TYPE = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1', 'subtitle2', 'body1', 'body2', 'caption', 'overline'] as const;

/** Cores do tema atual (troque Visual, Marca e Modo na barra de cima). */
function Cores() {
  return (
    <Stack spacing={3}>
      <Panel title="Paleta">
        <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {PALETTE.map((color) => (
            <Stack key={color} spacing={0.5} sx={{ width: 120 }}>
              <Box sx={{ height: 56, borderRadius: 2, bgcolor: `${color}.main` }} />
              <Typography variant="subtitle2">{color}</Typography>
              <Stack direction="row" sx={{ height: 12, borderRadius: 1, overflow: 'hidden' }}>
                {(['light', 'main', 'dark'] as const).map((shade) => (
                  <Box key={shade} sx={{ flex: 1, bgcolor: `${color}.${shade}` }} />
                ))}
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Panel>
      <Panel title="Tons suaves" subtitle="Fundo e texto dos chips, avatares e botões de ícone; legíveis no claro e no escuro">
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {TONES.map((tone) => (
            <Box key={tone} sx={(theme) => ({ ...softColors(theme, tone), px: 1.5, py: 0.75, borderRadius: 1.5, typography: 'body2' })}>
              {tone}
            </Box>
          ))}
        </Stack>
      </Panel>
    </Stack>
  );
}

function Tipografia() {
  const theme = useTheme();
  return (
    <Panel title="Tipografia" subtitle={String(theme.typography.fontFamily)}>
      <Stack spacing={1}>
        {TYPE.map((variant) => (
          <Typography key={variant} variant={variant}>
            {variant} · Faturas em aberto de novembro
          </Typography>
        ))}
      </Stack>
    </Panel>
  );
}

/** Alturas P/M/G de campo e botão: C3 40/48/56, Angle 31/35/42 (`theme.fieldHeight`). */
function Tamanhos() {
  const theme = useTheme();
  return (
    <Panel title="Tamanhos de campo">
      <Stack spacing={2} sx={{ maxWidth: 420 }}>
        {(['small', 'medium', 'large'] as const).map((size) => (
          <Stack key={size} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <TextField size={size} label={`${size} · ${theme.fieldHeight[size]}px`} defaultValue="Ana Souza" fullWidth />
            <Button variant="contained" size={size}>
              Salvar
            </Button>
          </Stack>
        ))}
      </Stack>
    </Panel>
  );
}

const meta = { title: 'Tema/Fundamentos', component: Cores, tags: ['!autodocs'] } satisfies Meta<typeof Cores>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Paleta: Story = {};
export const Fontes: Story = { name: 'Tipografia', render: () => <Tipografia /> };
export const Campos: Story = { name: 'Tamanhos de campo', render: () => <Tamanhos /> };
