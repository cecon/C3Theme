import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within } from 'storybook/test';

import { DeviceLink, Panel } from '@c3theme/ui';

// texto de exemplo no formato do que o serviço manda (ref,chave,chave,chave); não liga nada de verdade
const qrText = (n: number) =>
  `2@Xb${n}Hq9vZr0YkLw3PmT8sNfJcUa6DgE1oViR4yB7nQeK2xAtFh5Wj,8tXQnZ0mR2vY+k3LpH9sWc1bJ=,Ue7Fr4Gk0Nq3Vh6Ym1Tb9Px=,${n}`;

const meta = {
  title: 'Componentes/Ligar aparelho',
  component: DeviceLink,
  args: {
    status: 'qr',
    qr: qrText(1),
    onUsePairingCode: fn(),
    onUseQr: fn(),
    onCancel: fn(),
    onRetry: fn()
  },
  argTypes: { status: { control: 'inline-radio', options: ['connecting', 'qr', 'pairing-code', 'connected', 'logged-out', 'error'] } },
  render: (args) => (
    <Panel title="WhatsApp da loja" sx={{ maxWidth: 760 }}>
      <DeviceLink {...args} />
    </Panel>
  )
} satisfies Meta<typeof DeviceLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Conectando: Story = { args: { status: 'connecting' } };

/** O QR é desenhado no cliente, preto sobre branco também no escuro (com a margem que a câmera precisa). */
export const QrCode: Story = { name: 'QR Code' };

/** O serviço manda um QR novo a cada ~20 s; aqui a cada 3 s. Só o desenho muda: o quadro não pisca nem pula. */
export const QrRenovando: Story = {
  name: 'QR renovando',
  render: function Render(args) {
    const [n, setN] = useState(1);
    useEffect(() => {
      const timer = setInterval(() => setN((v) => v + 1), 3000);
      return () => clearInterval(timer);
    }, []);
    return (
      <Panel title="WhatsApp da loja" sx={{ maxWidth: 760 }}>
        <DeviceLink {...args} qr={qrText(n)} />
      </Panel>
    );
  }
};

/** "Usar código em vez de QR" sem o número: pede o celular antes de chamar o app. */
export const PedirNumero: Story = {
  name: 'Usar código (pede o número)',
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Usar código em vez de QR' }));
  }
};

export const CodigoDePareamento: Story = { name: 'Código de pareamento', args: { status: 'pairing-code', pairingCode: 'K7P2QX9M' } };

export const Conectado: Story = { args: { status: 'connected', account: '+55 11 98765-4321' } };

export const Desconectado: Story = { args: { status: 'logged-out' } };

export const Erro: Story = { args: { status: 'error', error: 'O serviço não respondeu em 30 segundos.' } };

/** Passos com o nome do aplicativo: o app troca os textos padrão (genéricos) pelos dele. */
export const PassosDoApp: Story = {
  name: 'Passos do app',
  args: {
    steps: [
      'Abra o WhatsApp no celular da loja.',
      'Toque em Mais opções › Dispositivos conectados › Conectar dispositivo.',
      'Aponte a câmera para este código.'
    ]
  }
};

/** Fluxo inteiro com o estado na mão da história: conectar, trocar para código, conectar, cair, tentar de novo. */
export const Fluxo: Story = {
  render: function Render(args) {
    const [status, setStatus] = useState<'connecting' | 'qr' | 'pairing-code' | 'connected' | 'logged-out' | 'error'>('connecting');
    useEffect(() => {
      if (status !== 'connecting') return undefined;
      const timer = setTimeout(() => setStatus('qr'), 1200);
      return () => clearTimeout(timer);
    }, [status]);
    return (
      <Panel title="WhatsApp da loja" sx={{ maxWidth: 760 }}>
        <DeviceLink
          {...args}
          status={status}
          pairingCode="K7P2QX9M"
          account="+55 11 98765-4321"
          onUsePairingCode={(phone) => {
            args.onUsePairingCode?.(phone);
            setStatus('pairing-code');
          }}
          onUseQr={() => setStatus('qr')}
          onCancel={() => setStatus('logged-out')}
          onRetry={() => setStatus('connecting')}
        />
      </Panel>
    );
  }
};
