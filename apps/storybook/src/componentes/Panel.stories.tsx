import type { Meta, StoryObj } from '@storybook/react-vite';

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Panel } from '@c3theme/ui';

const meta = {
  title: 'Componentes/Panel',
  component: Panel,
  args: {
    title: 'Faturas do mês',
    subtitle: 'Atualizado há 5 minutos',
    children: <Typography color="text.secondary">Conteúdo do cartão: lista, gráfico, formulário.</Typography>
  }
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basico: Story = { name: 'Básico' };

export const ComAcao: Story = {
  name: 'Com ação no cabeçalho',
  args: { action: <Button size="small">Ver todas</Button> }
};

export const ComRodape: Story = {
  name: 'Com rodapé',
  args: {
    footer: (
      <>
        <Button variant="outlined">Cancelar</Button>
        <Button variant="contained">Salvar</Button>
      </>
    )
  }
};

export const SemTitulo: Story = { name: 'Sem título', args: { title: undefined, subtitle: undefined } };
