import type { Author, Conversation, Message } from '@c3theme/chat';

export const ANA: Author = { id: 'ana', name: 'Ana Souza' };
export const EU: Author = { id: 'eu', name: 'Você' };
export const ASSISTENTE: Author = { id: 'ia', name: 'Assistente' };

const at = (min: number) => new Date(Date.UTC(2026, 10, 8, 13, min)).toISOString();
const base = { conversationId: 'c1' };

export const CONVERSA: Message[] = [
  { ...base, id: '1', author: ANA, direction: 'in', text: 'Oi! A fatura FT-0042 já foi emitida?', createdAt: at(0) },
  { ...base, id: '2', author: EU, direction: 'out', text: 'Bom dia, Ana. Foi sim, vence dia 15.', createdAt: at(1), status: 'read' },
  { ...base, id: '3', author: EU, direction: 'out', text: 'Mando o boleto por aqui?', createdAt: at(1), status: 'delivered' },
  { ...base, id: '4', author: ANA, direction: 'in', text: 'Por favor 🙏', createdAt: at(3) },
  { ...base, id: '5', clientId: '5', author: EU, direction: 'out', text: 'Segue o boleto.', createdAt: at(4), status: 'failed' }
];

export const RESPOSTA: Message = {
  ...base,
  id: 'r1',
  author: ASSISTENTE,
  direction: 'in',
  format: 'markdown',
  createdAt: at(10),
  reasoningMs: 4200,
  tools: [
    { id: 't1', name: 'faturas_consultar', label: 'Consultar faturas', status: 'done', durationMs: 820 },
    { id: 't2', name: 'clientes_consultar', label: 'Consultar clientes', status: 'done', durationMs: 310 }
  ],
  text: [
    'Encontrei **3 faturas atrasadas** de novembro:',
    '',
    '| Fatura | Cliente | Valor |',
    '| --- | --- | ---: |',
    '| FT-0042 | Ana Souza | R$ 1.234,50 |',
    '| FT-0047 | Bruno Lima | R$ 380,00 |',
    '| FT-0051 | Carla Mendes | R$ 2.010,00 |',
    '',
    'Quer que eu mande o lembrete de cobrança para os três?'
  ].join('\n')
};

export const CONVERSAS: Conversation[] = [
  {
    id: 'c1',
    title: 'Ana Souza',
    unread: 2,
    updatedAt: at(4),
    lastMessage: { text: 'Por favor 🙏', createdAt: at(3), direction: 'in', author: ANA }
  },
  { id: 'c2', title: 'Bruno Lima', subtitle: 'Comercial', unread: 0, updatedAt: at(-60), pinned: true },
  { id: 'c3', title: 'Equipe financeiro', unread: 0, updatedAt: at(-300), muted: true }
];
