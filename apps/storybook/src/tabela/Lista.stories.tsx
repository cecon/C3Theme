import type { Meta, StoryObj } from '@storybook/react-vite';

import MotorScreen from '../motor/MotorScreen';
import { jsonSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';

/**
 * A lista que o motor monta de `views.list`: colunas (avatar, segunda linha, cidade com UF), busca, filtros, ordem,
 * paginação, chip colorido do `enum`, ações da linha e, com ação `bulk`, seleção e lote. É a tabela que um sistema C3
 * usa; o `DataTable` do `@c3theme/ui` fica para tela feita em código.
 */
const meta = {
  title: 'Tabela/Lista pelo motor',
  component: MotorScreen,
  decorators: [withMotor],
  parameters: { docs: { source: jsonSource } },
  args: { entity: 'cliente', screen: 'list' },
  argTypes: { screen: { control: false }, id: { control: false } }
} satisfies Meta<typeof MotorScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Avatar com as iniciais, e-mail embaixo do nome, situação em chip e ver/editar/excluir na linha. */
export const Clientes: Story = {};

/** `actions[].bulk`: marque linhas e o lote aparece; `totals` soma o valor; `rowActionsStyle: quiet`. */
export const Faturas: Story = { name: 'Faturas, com seleção e lote', args: { entity: 'fatura' } };

/** O mesmo registro aberto: o formulário vem dos campos, sem `views.form`. */
export const Registro: Story = { name: 'Registro aberto', args: { screen: 'form', id: '3' } };
