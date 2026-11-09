import { Flash, Profile2User, Routing2, TickCircle, Timer1 } from 'iconsax-reactjs';

import type { FlowGraph, FlowNodeKind, FlowRun } from '@c3theme/flow';

const AGENTES = [
  { value: 'atendente', label: 'Atendente' },
  { value: 'cozinha', label: 'Cozinha' },
  { value: 'entregas', label: 'Entregas' }
];

const agenteLabel = (v: unknown) => AGENTES.find((a) => a.value === v)?.label;

/** Tipos de passo do exemplo (Piecework): gatilho, agente, condição, esperar e fim. */
export const KINDS: FlowNodeKind[] = [
  {
    type: 'gatilho',
    label: 'Gatilho',
    tone: 'warning',
    icon: <Flash variant="Bold" />,
    hasInput: false,
    outputs: [{ id: 'out' }],
    fields: [
      {
        key: 'evento',
        label: 'Evento',
        kind: 'select',
        required: true,
        options: [
          { value: 'whatsapp', label: 'Mensagem no WhatsApp' },
          { value: 'webhook', label: 'Webhook' }
        ]
      }
    ]
  },
  {
    type: 'agente',
    label: 'Agente',
    tone: 'primary',
    icon: <Profile2User variant="Bold" />,
    hasInput: true,
    outputs: [{ id: 'out' }],
    fields: [
      { key: 'agente', label: 'Agente', kind: 'select', required: true, options: AGENTES },
      { key: 'pedido', label: 'O que pedir', kind: 'textarea' }
    ],
    summary: (n) => agenteLabel(n.config?.agente)
  },
  {
    type: 'condicao',
    label: 'Condição',
    tone: 'info',
    icon: <Routing2 variant="Bold" />,
    hasInput: true,
    outputs: [
      { id: 'sim', label: 'sim' },
      { id: 'nao', label: 'não' }
    ],
    fields: [
      { key: 'regra', label: 'Regra', kind: 'text', required: true, helperText: 'Ex.: pedido.confirmado == true' },
      { key: 'maxVoltas', label: 'Máximo de voltas', kind: 'number', helperText: 'Obrigatório quando a condição fecha um ciclo' }
    ],
    loopLimitKey: 'maxVoltas',
    summary: (n) => (n.config?.regra as string) || undefined
  },
  {
    type: 'esperar',
    label: 'Esperar',
    tone: 'secondary',
    icon: <Timer1 variant="Bold" />,
    hasInput: true,
    outputs: [{ id: 'out' }],
    fields: [{ key: 'minutos', label: 'Minutos', kind: 'number', required: true }],
    summary: (n) => (n.config?.minutos ? `${n.config.minutos} min` : undefined)
  },
  {
    type: 'fim',
    label: 'Fim',
    tone: 'success',
    icon: <TickCircle variant="Bold" />,
    hasInput: true,
    outputs: []
  }
];

const at = (x: number, y: number) => ({ x, y });

/** Pedido pelo WhatsApp: Atendente → confirmado? → Cozinha → espera → Entregas → fim. 6 nós, sem problemas. */
export const PEDIDO: FlowGraph = {
  nodes: [
    { id: 'zap', type: 'gatilho', position: at(0, 80), label: 'Mensagem no WhatsApp', config: { evento: 'whatsapp' } },
    { id: 'atendente', type: 'agente', position: at(300, 80), label: 'Pedir ao Atendente', config: { agente: 'atendente' } },
    { id: 'confirmado', type: 'condicao', position: at(600, 80), label: 'Pedido confirmado?', config: { regra: 'pedido.confirmado' } },
    { id: 'cozinha', type: 'agente', position: at(900, 0), label: 'Pedir à Cozinha', config: { agente: 'cozinha' } },
    { id: 'entregas', type: 'agente', position: at(1200, 0), label: 'Chamar entregador', config: { agente: 'entregas' } },
    { id: 'fim', type: 'fim', position: at(1200, 200), label: 'Fim' }
  ],
  edges: [
    { id: 'e1', source: 'zap', sourcePort: 'out', target: 'atendente' },
    { id: 'e2', source: 'atendente', sourcePort: 'out', target: 'confirmado' },
    { id: 'e3', source: 'confirmado', sourcePort: 'sim', target: 'cozinha' },
    { id: 'e4', source: 'confirmado', sourcePort: 'nao', target: 'fim' },
    { id: 'e5', source: 'cozinha', sourcePort: 'out', target: 'entregas' },
    { id: 'e6', source: 'entregas', sourcePort: 'out', target: 'fim' }
  ]
};

/** Execução no meio: Atendente e condição concluídos (saiu pelo "sim"), Cozinha trabalhando. */
export const EM_ANDAMENTO: FlowRun = {
  status: { zap: 'done', atendente: 'done', confirmado: 'done', cozinha: 'running', entregas: 'idle', fim: 'idle' },
  traversed: ['e1', 'e2', 'e3']
};

/** Com problemas: saída "não" solta, nó de espera solto, ciclo sem limite e campo obrigatório vazio. */
export const COM_ERROS: FlowGraph = {
  nodes: [
    ...PEDIDO.nodes.map((n) => (n.id === 'cozinha' ? { ...n, config: {} } : n)),
    { id: 'esperar', type: 'esperar', position: at(600, 280), label: 'Esperar 10 minutos', config: { minutos: 10 } }
  ],
  edges: [
    ...PEDIDO.edges.filter((e) => e.id !== 'e4' && e.id !== 'e6'),
    { id: 'volta', source: 'entregas', sourcePort: 'out', target: 'atendente' }
  ]
};
