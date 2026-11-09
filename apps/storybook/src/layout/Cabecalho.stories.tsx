import type { Meta, StoryObj } from '@storybook/react-vite';
import { Profile, Setting2 } from 'iconsax-reactjs';
import { fn } from 'storybook/test';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { Breadcrumbs, ColorModeButton, NotificationsButton, UserMenu } from '@c3theme/ui';
import { AVISOS } from './avisos';

/**
 * Uso direto. Pelo motor, o cabeçalho sai de `layout.header` ("Layout/Shell pelo motor", com o sino de
 * `notifications`), mas `languages` e `userMenu` estão na spec e a shell ainda não desenha; o menu do usuário depende da sessão do `auth`.
 */
const meta = {
  title: 'Layout/Cabeçalho (uso direto)',
  tags: ['uso-direto'],
  component: UserMenu,
  args: {
    name: 'Ana Souza',
    email: 'ana@exemplo.com',
    role: 'Financeiro',
    items: [
      { label: 'Meu perfil', icon: Profile, onClick: fn() },
      { label: 'Preferências', icon: Setting2, onClick: fn() }
    ],
    onLogout: fn()
  }
} satisfies Meta<typeof UserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MenuDoUsuario: Story = { name: 'Menu do usuário' };

export const BotoesDoHeader: Story = {
  name: 'Botões do header',
  render: (args) => (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <NotificationsButton items={AVISOS} onMarkAllRead={fn()} onItemClick={fn()} />
      <ColorModeButton />
      <UserMenu {...args} />
    </Stack>
  )
};

/** Lista com os últimos avisos e o contador vindo do servidor (`unread`), maior que os não lidos da lista. */
export const SinoComTotal: Story = {
  name: 'Sino com total do servidor',
  render: () => <NotificationsButton items={AVISOS} unread={27} onMarkAllRead={fn()} onItemClick={fn()} />
};

/** Grupo sem rota abre a lista das telas dele; o último item é a página atual. */
export const Migalhas: Story = {
  name: 'Migalhas (breadcrumbs)',
  render: () => (
    <Breadcrumbs
      links={[
        {
          title: 'Vendas',
          options: [
            { title: 'Pedidos', to: '/vendas/pedidos' },
            { title: 'Faturas', to: '/vendas/faturas', current: true }
          ]
        },
        { title: 'Faturas' }
      ]}
      action={<Button variant="contained">Nova fatura</Button>}
    />
  )
};
