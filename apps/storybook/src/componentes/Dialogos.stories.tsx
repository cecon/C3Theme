import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ActionDialog } from '@c3theme/ui';
import MotorScreen from '../motor/MotorScreen';
import { clickAction, runAction } from '../motor/play';
import { jsonSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';

/**
 * Pelo motor: `actions` da entidade viram botões no registro. Com `input` ou `confirm` o motor abre o diálogo (título,
 * descrição, campos, cor do `tone`, `confirmLabel`); a recusa do sistema aparece dentro dele. A história abre a ação.
 */
const meta = {
  title: 'Componentes/Diálogos',
  component: MotorScreen,
  decorators: [withMotor],
  args: { entity: 'fatura', screen: 'form', id: '2' },
  argTypes: { screen: { control: false }, id: { control: false } },
  // diálogo aberto cobre a página: na documentação cada história fica no seu quadro
  parameters: { docs: { source: jsonSource, story: { inline: false, iframeHeight: 560 } } }
} satisfies Meta<typeof MotorScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** `input.fields` com motivo obrigatório e `tone: danger`. */
export const Acao: Story = { name: 'Ação com motivo', play: clickAction('Cancelar fatura') };

/** O sistema recusou (o handler da ação lançou erro): a mensagem fica no diálogo, que não fecha. */
export const ComErro: Story = {
  name: 'Com erro do sistema',
  args: { id: '3' },
  play: runAction('Cancelar fatura', { Motivo: 'Cliente desistiu da compra' })
};

/** Ação sem input com `confirm`: confirmação curta antes de rodar. */
export const Confirmacao: Story = { name: 'Confirmação', args: { id: '1' }, play: clickAction('Reabrir') };

/** Excluir o registro: o motor sempre confirma. */
export const Exclusao: Story = { name: 'Exclusão', args: { entity: 'cliente', id: '4' }, play: clickAction('Excluir') };

/** Uso direto: o "salvando" do diálogo só dura o tempo da resposta; aqui ele fica parado para ver. */
export const Carregando: Story = {
  name: 'Carregando (uso direto)',
  tags: ['uso-direto'],
  render: () => (
    <ActionDialog open loading title="Cancelar fatura" confirmLabel="Cancelar fatura" tone="danger" onConfirm={fn()} onClose={fn()} />
  )
};
