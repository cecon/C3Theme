import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import MotorField from '../motor/MotorField';
import { jsonSource } from '../motor/source';
import { withMotor } from '../motor/withMotor';

/**
 * Pelo motor: `string`, `text`, `email` e `boolean`; `format` (CPF/CNPJ) põe a máscara e confere o dígito, e
 * `writeOnly` vira senha (a leitura volta vazia e, num registro gravado, vazio mantém a senha).
 */
const meta = {
  title: 'Campos/Texto e documento',
  component: MotorField,
  decorators: [withMotor],
  parameters: { docs: { source: jsonSource } },
  args: { entity: 'produto', field: 'nome', value: 'Café torrado 500 g', onChange: fn() }
} satisfies Meta<typeof MotorField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Texto: Story = {};

export const TextoLongo: Story = {
  name: 'Texto longo',
  args: { field: 'descricao', value: 'Grãos arábica de torra média, moídos na hora do envio.' }
};

export const Email: Story = { name: 'E-mail', args: { entity: 'loja', field: 'email', value: 'contato@loja.com.br' } };

export const Documento: Story = { name: 'CNPJ', args: { entity: 'loja', field: 'cnpj', value: '11222333000181' } };

export const Senha: Story = { args: { entity: 'loja', field: 'senha_certificado', value: null } };

export const SenhaGravada: Story = {
  name: 'Senha já gravada',
  args: { entity: 'loja', field: 'senha_certificado', value: null, existing: true }
};

export const Liga: Story = { name: 'Liga e desliga', args: { field: 'ativo', value: true } };
