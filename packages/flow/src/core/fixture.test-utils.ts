import type { FlowGraph, FlowNodeType } from './types';

// Tipos e fluxo de exemplo dos testes: WhatsApp → Atendente → pedido confirmado? → Cozinha → fim.
export const TYPES: FlowNodeType[] = [
  { type: 'gatilho', label: 'Gatilho', hasInput: false, outputs: [{ id: 'out' }] },
  {
    type: 'agente',
    label: 'Agente',
    hasInput: true,
    outputs: [{ id: 'out' }],
    fields: [{ key: 'agente', label: 'Agente', kind: 'text', required: true }]
  },
  {
    type: 'condicao',
    label: 'Condição',
    hasInput: true,
    outputs: [
      { id: 'sim', label: 'sim' },
      { id: 'nao', label: 'não' }
    ],
    loopLimitKey: 'maxVoltas'
  },
  { type: 'fim', label: 'Fim', hasInput: true, outputs: [] }
];

export const FLOW: FlowGraph = {
  nodes: [
    { id: 'zap', type: 'gatilho', position: { x: 0, y: 0 }, label: 'Mensagem no WhatsApp' },
    { id: 'atendente', type: 'agente', position: { x: 0, y: 0 }, config: { agente: 'Atendente' } },
    { id: 'confirmado', type: 'condicao', position: { x: 0, y: 0 } },
    { id: 'cozinha', type: 'agente', position: { x: 0, y: 0 }, config: { agente: 'Cozinha' } },
    { id: 'fim', type: 'fim', position: { x: 0, y: 0 } }
  ],
  edges: [
    { id: 'e1', source: 'zap', sourcePort: 'out', target: 'atendente' },
    { id: 'e2', source: 'atendente', sourcePort: 'out', target: 'confirmado' },
    { id: 'e3', source: 'confirmado', sourcePort: 'sim', target: 'cozinha' },
    { id: 'e4', source: 'confirmado', sourcePort: 'nao', target: 'fim' },
    { id: 'e5', source: 'cozinha', sourcePort: 'out', target: 'fim' }
  ]
};
