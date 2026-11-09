import { SoftAvatar } from '@c3theme/ui';
import type { AgentRequest, DockAgent, Message } from '@c3theme/chat';

import { ANA } from './mensagens';

type Tone = 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'secondary' | 'neutral';
const avatar = (letters: string, tone: Tone) => (
  <SoftAvatar tone={tone} look="filled">
    {letters}
  </SoftAvatar>
);

/** Um agente em cada estado, para a doca. */
export const AGENTES: DockAgent[] = [
  { id: 'atendente', name: 'Atendente', state: 'waiting', avatar: avatar('AT', 'primary'), pending: 1 },
  { id: 'financeiro', name: 'Financeiro', state: 'working', avatar: avatar('FI', 'success') },
  { id: 'estoque', name: 'Estoque', state: 'thinking', avatar: avatar('ES', 'info') },
  { id: 'vendas', name: 'Vendas', state: 'talking', avatar: avatar('VE', 'warning') },
  { id: 'fiscal', name: 'Fiscal', state: 'error', avatar: avatar('FS', 'danger'), pending: 1 },
  { id: 'compras', name: 'Compras', state: 'paused', avatar: avatar('CO', 'secondary') },
  { id: 'relatorios', name: 'Relatórios', state: 'done', avatar: avatar('RE', 'primary') },
  { id: 'agenda', name: 'Agenda', state: 'idle', avatar: avatar('AG', 'neutral') }
];

export const avatarOf = (id: string) => AGENTES.find((a) => a.id === id)?.avatar;

const at = (min: number) => new Date(Date.UTC(2026, 10, 8, 13, min)).toISOString();
const BOT = { id: 'atendente', name: 'Atendente' };

export const CONVERSA_AGENTE: Message[] = [
  {
    id: 'g1',
    conversationId: 'atendente',
    author: ANA,
    direction: 'out',
    text: 'Responde a Marina sobre o boleto?',
    createdAt: at(0),
    status: 'read'
  },
  {
    id: 'g2',
    conversationId: 'atendente',
    author: BOT,
    direction: 'in',
    text: 'Respondi. Ela pediu para mudar o vencimento para dia 20.',
    createdAt: at(2)
  },
  { id: 'g3', conversationId: 'atendente', author: BOT, direction: 'in', text: 'Posso gerar o boleto novo?', createdAt: at(2) }
];

export const PEDIDOS: AgentRequest[] = [
  {
    id: 'p1',
    kind: 'approval',
    agentId: 'atendente',
    agentName: 'Atendente',
    text: 'Gerar boleto novo da FT-0042 com vencimento em 20/11?'
  },
  {
    id: 'p2',
    kind: 'question',
    agentId: 'vendas',
    agentName: 'Vendas',
    text: 'Qual desconto posso oferecer ao Bruno na renovação?',
    placeholder: 'Ex.: até 10%'
  },
  {
    id: 'p3',
    kind: 'progress',
    agentId: 'financeiro',
    agentName: 'Financeiro',
    text: 'Conciliando 120 lançamentos do extrato',
    progress: 0.62
  },
  {
    id: 'p4',
    kind: 'failure',
    agentId: 'fiscal',
    agentName: 'Fiscal',
    text: 'A SEFAZ recusou a NF 1.204: CFOP incompatível com a operação.'
  }
];
