import { SoftAvatar } from '@c3theme/ui';
import type { AgentState, Author, Message } from '@c3theme/chat';

// Canal do restaurante: três agentes (atendente, cozinha, entregas) e uma pessoa (Marina, cliente).
export const ATENDENTE: Author = { id: 'atendente', name: 'Atendente', kind: 'agent', color: '#4680ff' };
export const COZINHA: Author = { id: 'cozinha', name: 'Cozinha', kind: 'agent', color: '#e58a00' };
export const ENTREGAS: Author = { id: 'entregas', name: 'Entregas', kind: 'agent', color: '#2ca87f' };
export const MARINA: Author = { id: 'marina', name: 'Marina Costa', kind: 'person' };
export const EU: Author = { id: 'eu', name: 'Você', kind: 'person' };

type Tone = 'primary' | 'warning' | 'success' | 'neutral';
const TONS: Record<string, [string, Tone]> = {
  atendente: ['AT', 'primary'],
  cozinha: ['CZ', 'warning'],
  entregas: ['EN', 'success'],
  marina: ['MC', 'neutral']
};

export const avatarDe = (author: Author) => {
  const [letters, tone] = TONS[author.id] ?? ['?', 'neutral'];
  return (
    <SoftAvatar tone={tone} look="filled">
      {letters}
    </SoftAvatar>
  );
};

export const ESTADOS: Record<string, AgentState> = { atendente: 'waiting', cozinha: 'working', entregas: 'idle' };

const at = (min: number) => new Date(Date.UTC(2026, 10, 8, 19, min)).toISOString();
const base = { conversationId: 'pedido-1204' };

export const TOOL_INPUT = JSON.stringify({ itens: [{ sku: 'LAS-01', nome: 'Lasanha à bolonhesa', qtd: 2 }], pedido: 1204 }, null, 2);

export const CANAL: Message[] = [
  {
    ...base,
    id: 'm1',
    author: MARINA,
    direction: 'in',
    text: 'Boa noite! Quero 2 lasanhas para entregar na Rua das Flores, 120.',
    createdAt: at(0)
  },
  {
    ...base,
    id: 'm2',
    author: ATENDENTE,
    direction: 'in',
    text: 'Boa noite, Marina! Anotei 2 lasanhas à bolonhesa. Vou confirmar com a cozinha.',
    createdAt: at(1)
  },
  {
    ...base,
    id: 'm3',
    author: ATENDENTE,
    direction: 'in',
    kind: 'handoff',
    handoff: { from: ATENDENTE, to: COZINHA, task: 'confirmar 2 lasanhas', taskId: 'pedido-1204' },
    createdAt: at(1)
  },
  {
    ...base,
    id: 'm4',
    author: COZINHA,
    direction: 'in',
    text: 'Tenho as duas. Preciso baixar do estoque para reservar.',
    createdAt: at(2),
    tools: [{ id: 't1', name: 'estoque_consultar', label: 'Consultar estoque', status: 'done', durationMs: 420 }],
    question: {
      id: 'ap1',
      prompt: '',
      kind: 'approval',
      tool: { name: 'estoque_baixar', label: 'Baixar estoque', input: TOOL_INPUT }
    }
  },
  {
    ...base,
    id: 'm5',
    author: EU,
    direction: 'out',
    text: 'Pode reservar. Entregas, quanto tempo até lá?',
    createdAt: at(3),
    status: 'read'
  },
  {
    ...base,
    id: 'm6',
    author: ENTREGAS,
    direction: 'in',
    text: 'Uns 35 minutos depois de sair da cozinha. O motoboy Lucas está livre.',
    createdAt: at(4)
  },
  {
    ...base,
    id: 'm7',
    author: ATENDENTE,
    direction: 'in',
    text: 'Marina, o pedido fica pronto em uns 50 minutos no total. Posso fechar?',
    createdAt: at(5),
    question: {
      id: 'q1',
      prompt: 'Fechar o pedido com a Marina?',
      options: [
        { id: 'sim', label: 'Fechar pedido', primary: true },
        { id: 'esperar', label: 'Esperar a cozinha' }
      ]
    }
  }
];
