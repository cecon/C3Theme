import { C3ThemeProvider } from '@c3theme/ui';
import type { Meta, StoryObj } from '@storybook/react-vite';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

/**
 * O `defaultMode` do motor em navegador de verdade (#132): a história traz o próprio
 * `C3ThemeProvider` — a moldura do Storybook fica de fora para nenhum provider de fora
 * sobrescrever a escolha. O e2e confere o estilo computado do fundo, não só o atributo.
 */
const meta = {
  title: 'Motor/Modo escuro',
  parameters: { providerDoTema: false, layout: 'fullscreen' }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Escuro: Story = {
  name: 'Modo escuro padrão',
  render: () => (
    <C3ThemeProvider defaultMode="dark" storageKey="storybook-modo-padrao">
      <Paper id="paper" sx={{ p: 4 }}>
        <Typography variant="h3">Fundo escuro</Typography>
        <Typography color="text.secondary">Texto claro sobre o papel escuro.</Typography>
      </Paper>
    </C3ThemeProvider>
  )
};
