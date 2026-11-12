import type { Meta, StoryObj } from '@storybook/react-vite';
import { C3Shell } from '@c3theme/engine';

// As telas são montadas pelo motor lendo app.status. O transporte só representa o backend do sistema.
const app = { specVersion: '0', name: 'Loja', entities: [], layout: { menu: [] } };
const meta = {
  title: 'Layout/Estado do sistema pelo motor',
  component: C3Shell,
  parameters: { bare: true },
  args: { apiUrl: '/api', icons: {}, router: 'hash' }
} satisfies Meta<typeof C3Shell>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Manutencao: Story = {
  name: 'Em manutenção',
  args: {
    transport: async () =>
      new Response(
        JSON.stringify({
          data: {
            ...app,
            status: {
              mode: 'maintenance',
              message: 'Estamos atualizando o sistema.',
              until: '2026-11-13T15:00:00Z'
            }
          }
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
  }
};

export const EmBreve: Story = {
  name: 'Em breve',
  args: {
    transport: async () =>
      new Response(
        JSON.stringify({
          data: {
            ...app,
            status: {
              mode: 'comingSoon',
              message: 'Uma nova loja está chegando.',
              until: '2026-12-01T12:00:00Z'
            }
          }
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
  }
};
