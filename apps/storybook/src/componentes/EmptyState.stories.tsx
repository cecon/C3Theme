import type { Meta, StoryObj } from '@storybook/react-vite';
import { Add } from 'iconsax-reactjs';

import Button from '@mui/material/Button';

import { EmptyState, MessagePage } from '@c3theme/ui';
import MotorScreen from '../motor/MotorScreen';
import { jsonSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';

/** Pelo motor: a lista sem registros e a busca sem resultado já vêm com o texto e a ação certos para a entidade. */
const meta = {
  title: 'Componentes/Estados vazios',
  component: MotorScreen,
  decorators: [withMotor],
  parameters: { docs: { source: jsonSource } },
  args: { entity: 'fornecedor' },
  argTypes: { screen: { control: false }, id: { control: false } }
} satisfies Meta<typeof MotorScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vazio: Story = {};

/** A busca vem do endereço (`?q=`), como quando o usuário digita e recarrega. */
export const BuscaSemResultado: Story = {
  name: 'Busca sem resultado',
  args: { entity: 'cliente' },
  parameters: { route: '/?q=joão' }
};

/** Uso direto: o motor não desenha estado vazio fora da lista. Aqui, o componente com ícone e ação próprios. */
export const Componente: Story = {
  name: 'Componente (uso direto)',
  tags: ['uso-direto'],
  render: () => (
    <EmptyState
      title="Nenhum cliente ainda"
      description="Cadastre o primeiro cliente para começar a emitir faturas."
      action={
        <Button variant="contained" startIcon={<Add size={18} />}>
          Novo cliente
        </Button>
      }
    />
  )
};

/** Uso direto: página inteira de mensagem (404, sem permissão, manutenção); a shell usa a dela nas rotas. */
export const Pagina: Story = {
  name: 'Página de mensagem (uso direto)',
  tags: ['uso-direto'],
  render: () => (
    <MessagePage
      code="404"
      title="Página não encontrada"
      description="O endereço pode ter mudado ou a tela foi removida."
      action={<Button variant="contained">Voltar ao início</Button>}
    />
  )
};
