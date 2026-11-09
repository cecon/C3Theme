import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { AccessRequest, AccessRequests, AllowEntry, AllowList, Panel } from '@c3theme/ui';

const minutes = (n: number) => Date.now() - n * 60_000;

const REQUESTS: AccessRequest[] = [
  {
    id: '1',
    name: 'Maria Souza',
    phone: '5511987654321',
    code: 'K7P2QX9M',
    message: 'Oi! Vi o anúncio de vocês e queria saber se fazem entrega no centro hoje à noite 😀',
    receivedAt: minutes(0)
  },
  {
    id: '2',
    name: 'Distribuidora Boa Vista Comércio de Alimentos e Bebidas Ltda',
    phone: '5521998877665',
    code: 'H3MZ8R1T',
    message:
      'Bom dia. Somos fornecedores de bebidas da região e gostaríamos de apresentar nossa tabela de preços.\n\nTemos condições especiais para pedidos acima de 50 caixas, entrega em até 48 horas e pagamento em 30/60/90 dias. Podemos marcar uma visita?',
    receivedAt: minutes(42)
  },
  {
    id: '3',
    phone: '14155550100',
    code: 'Q9WX2N7C',
    message: '<script>alert(1)</script> isto aparece como texto',
    receivedAt: minutes(60 * 26)
  },
  { id: '4', name: 'João', phone: '5548991234567', code: 'P4TR6Y2B', receivedAt: minutes(60 * 5) }
];

const meta = {
  title: 'Componentes/Pedidos de acesso',
  component: AccessRequests,
  args: { requests: REQUESTS, onApprove: fn(), onReject: fn() },
  render: (args) => (
    <Panel title="Pedidos de acesso" sx={{ maxWidth: 760 }}>
      <AccessRequests {...args} />
    </Panel>
  )
} satisfies Meta<typeof AccessRequests>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nome longo, mensagem longa, sem nome, sem mensagem e texto com HTML (aparece como texto). */
export const Pendentes: Story = {};

/** Enquanto o app grava a decisão, os botões do pedido ficam desligados. */
export const Gravando: Story = { args: { busyIds: ['1'] } };

export const Vazio: Story = { args: { requests: [] } };

/** Aprovar ou recusar tira o pedido da lista (o app faria isso depois de gravar). */
export const Decidindo: Story = {
  render: function Render(args) {
    const [requests, setRequests] = useState(REQUESTS);
    const drop = (r: AccessRequest) => setRequests((list) => list.filter((x) => x.id !== r.id));
    return (
      <Panel title="Pedidos de acesso" sx={{ maxWidth: 760 }}>
        <AccessRequests {...args} requests={requests} onApprove={drop} onReject={drop} />
      </Panel>
    );
  }
};

const ENTRIES: AllowEntry[] = [
  { id: '1', kind: 'contact', value: '5511987654321', label: 'Maria Souza', access: 'allowed' },
  { id: '2', kind: 'group', value: '120363041234567890@g.us', label: 'Entregadores', access: 'allowed' },
  { id: '3', kind: 'contact', value: '5521998877665', access: 'blocked' },
  { id: '4', kind: 'group', value: '120363049876543210@g.us', access: 'blocked' }
];

/** Liberados e bloqueados: o campo aceita telefone (com ou sem máscara) ou ID de grupo e recusa duplicado. */
export const Liberados: Story = {
  name: 'Liberados e bloqueados',
  render: function Render() {
    const [entries, setEntries] = useState(ENTRIES);
    return (
      <Panel title="Quem pode falar com a loja" sx={{ maxWidth: 560 }}>
        <AllowList
          entries={entries}
          onAdd={(e) => setEntries((list) => [...list, { ...e, id: String(Date.now()) }])}
          onChangeAccess={(entry, access) => setEntries((list) => list.map((x) => (x.id === entry.id ? { ...x, access } : x)))}
          onRemove={(entry) => setEntries((list) => list.filter((x) => x.id !== entry.id))}
        />
      </Panel>
    );
  }
};

export const ListaVazia: Story = {
  name: 'Lista vazia',
  render: () => (
    <Panel title="Quem pode falar com a loja" sx={{ maxWidth: 560 }}>
      <AllowList entries={[]} onAdd={fn()} />
    </Panel>
  )
};
