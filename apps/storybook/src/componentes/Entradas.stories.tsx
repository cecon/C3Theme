import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { InlineAdd, OtpInput, PasswordStrength } from '@c3theme/ui';
import { stateful } from '../support/stateful';

const Otp = stateful(OtpInput);

const meta = {
  title: 'Componentes/Entradas',
  component: OtpInput,
  args: { value: '', length: 6, numeric: true, error: false, onChange: fn() }
} satisfies Meta<typeof OtpInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Código de verificação: cola o código inteiro, anda sozinho entre as casas. */
export const Codigo: Story = { name: 'Código (OTP)', render: (args) => <Otp {...args} /> };

export const CodigoErrado: Story = { name: 'Código com erro', args: { value: '123456', error: true }, render: (args) => <Otp {...args} /> };

/** Força da senha enquanto digita. */
export const ForcaDaSenha: Story = {
  name: 'Força da senha',
  render: function Render() {
    const [password, setPassword] = useState('c3');
    return (
      <Stack spacing={1} sx={{ maxWidth: 360 }}>
        <TextField label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <PasswordStrength password={password} />
      </Stack>
    );
  }
};

/** Adicionar item sem sair da lista (quadro, checklist). */
export const AdicionarNaLinha: Story = {
  name: 'Adicionar na linha',
  render: () => (
    <Stack sx={{ maxWidth: 320 }}>
      <InlineAdd label="Adicionar tarefa" placeholder="Título da tarefa" onAdd={fn()} />
    </Stack>
  )
};

/** Com validação: o erro aparece embaixo do campo ao tentar adicionar e não deixa passar. */
export const AdicionarComValidacao: Story = {
  name: 'Adicionar na linha (com validação)',
  render: () => (
    <Stack sx={{ maxWidth: 320 }}>
      <InlineAdd
        defaultOpen
        label="Adicionar e-mail"
        placeholder="E-mail"
        inputMode="email"
        validate={(v) => (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? undefined : 'Digite um e-mail válido.')}
        onAdd={fn()}
      />
    </Stack>
  )
};
