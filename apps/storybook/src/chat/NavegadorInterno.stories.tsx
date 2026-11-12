import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Box from '@mui/material/Box';

import { BrowserView } from '@c3theme/chat';
import pagina from './pagina-pagamento.png';

/**
 * A peça do navegador interno, sozinha: o painel ao lado do chat que acompanha o navegador remoto do agente. No chat,
 * ela chega pela parte `c3.browser` (veja "Humano no circuito"); montar o painel ao vivo pela spec é a lacuna
 * cecon/C3Theme#71 (uso direto até lá).
 */
const meta = {
  title: 'Chat/Navegador interno (uso direto)',
  component: BrowserView,
  tags: ['uso-direto'],
  args: {
    url: 'https://banco.example.com/pagamentos/boleto',
    title: 'Pagamento de boleto',
    frame: pagina,
    activity: 'Conferindo o valor do boleto',
    target: { x: 83, y: 71 },
    control: 'agent',
    canGoBack: true,
    onTakeOver: fn()
  },
  render: (args) => (
    <Box sx={{ maxWidth: 560 }}>
      <BrowserView {...args} />
    </Box>
  )
} satisfies Meta<typeof BrowserView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** O agente no controle: a barra trava e só "Assumir controle" fica ativo. */
export const AgenteNoControle: Story = { name: 'Agente no controle' };

/** O humano assumiu: navega pela barra (Enter vai, Esc desiste), volta, recarrega e devolve ao agente. */
export const VoceNoControle: Story = {
  name: 'Você no controle',
  render: function Render(args) {
    const [url, setUrl] = useState(args.url);
    const [control, setControl] = useState<'agent' | 'user'>('user');
    return (
      <Box sx={{ maxWidth: 560 }}>
        <BrowserView
          {...args}
          url={url}
          control={control}
          activity={undefined}
          target={undefined}
          onNavigate={setUrl}
          onBack={fn()}
          onReload={fn()}
          onHandBack={() => setControl('agent')}
          onTakeOver={() => setControl('user')}
        />
      </Box>
    );
  }
};

export const Carregando: Story = { args: { status: 'loading', frame: undefined, activity: undefined, target: undefined } };

export const Erro: Story = { args: { status: 'error', error: 'O site recusou a conexão do navegador do agente.' } };
