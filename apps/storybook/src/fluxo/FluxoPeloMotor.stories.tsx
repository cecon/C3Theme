import type { Meta, StoryObj } from '@storybook/react-vite';

import { jsonSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';
import FluxoPeloMotor from './FluxoPeloMotor';

/**
 * O editor de fluxo declarado na spec (`views.flow` da entidade): o grafo `{ nodes, edges }` fica num campo `text` do
 * registro e grava pelo PATCH de sempre. Os tipos de passo (gatilho, agente, condição, esperar, fim), os campos de
 * cada um, o ícone, a cor, o resumo no cartão e as regras (`max`, `removable`, `loopLimit`, `defaults`) vêm do JSON.
 * Fluxo com problema não grava: o sistema que roda recebe sempre um grafo válido.
 */
const meta = {
  title: 'Fluxo/Pelo motor',
  component: FluxoPeloMotor,
  decorators: [withMotor],
  parameters: {
    motor: { entity: 'automacao' },
    route: '/automacao/1/flow',
    docs: { source: jsonSource, story: { inline: false, iframeHeight: 760 } }
  }
} satisfies Meta<typeof FluxoPeloMotor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** O fluxo do pedido pelo WhatsApp: 6 passos, Salvar e Descartar só com mudança. */
export const Editor: Story = { name: 'Editor do fluxo' };

/** Automação sem passos ainda: o editor começa vazio e o gatilho novo já entra com o evento padrão (`defaults`). */
export const Vazio: Story = { name: 'Fluxo vazio', parameters: { route: '/automacao/2/flow' } };

/** No formulário, o campo do grafo não é um texto: mostra quantos passos tem e o botão que abre o editor. */
export const NoFormulario: Story = { name: 'Campo no formulário', parameters: { route: '/automacao/1' } };
