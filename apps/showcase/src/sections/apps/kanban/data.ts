// third-party
import { addDays, setHours, startOfDay, subDays } from 'date-fns';

import type { StatusTone, Tone } from '@c3theme/ui';

export type Priority = 'baixa' | 'media' | 'alta';

export const PRIORITY: Record<Priority, { label: string; tone: StatusTone }> = {
  baixa: { label: 'Baixa', tone: 'success' },
  media: { label: 'Média', tone: 'warning' },
  alta: { label: 'Alta', tone: 'danger' }
};

export interface Member {
  id: string;
  name: string;
  tone: Tone;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  at: Date;
}

export interface FileRef {
  id: string;
  name: string;
  size: number;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  assigneeId: string | null;
  priority: Priority;
  due: Date | null;
  comments: Comment[];
  attachments: FileRef[];
}

export interface Column {
  id: string;
  title: string;
  cardIds: string[];
}

export interface Story {
  id: string;
  /** Número exibido como HU-01, HU-02… */
  code: number;
  title: string;
  description: string;
  acceptance: string;
  assigneeId: string | null;
  priority: Priority;
  /** Coluna do quadro que representa a situação da história. */
  columnId: string;
  due: Date | null;
  cardIds: string[];
  comments: Comment[];
}

export interface KanbanData {
  members: Member[];
  cards: Record<string, Card>;
  columns: Record<string, Column>;
  columnOrder: string[];
  stories: Record<string, Story>;
  storyOrder: string[];
  /** Coluna que conta como "concluído" (cartões riscados, prazo verde). */
  doneColumnId: string | null;
}

/** Quem está usando a demonstração (autor dos comentários novos). */
export const CURRENT_USER = 'rafael';

const MEMBERS: Member[] = [
  { id: 'rafael', name: 'Rafael Monteiro', tone: 'primary' },
  { id: 'ana', name: 'Ana Beatriz Souza', tone: 'info' },
  { id: 'bruno', name: 'Bruno Carvalho', tone: 'success' },
  { id: 'camila', name: 'Camila Rocha', tone: 'warning' },
  { id: 'diego', name: 'Diego Martins', tone: 'secondary' }
];

// datas relativas a hoje, calculadas uma vez
const today = startOfDay(new Date());
const inDays = (n: number) => addDays(today, n);
const ago = (days: number, hour: number) => setHours(subDays(today, days), hour);

function card(
  id: string,
  title: string,
  assigneeId: string | null,
  priority: Priority,
  due: number | null,
  extra: Partial<Card> = {}
): Card {
  return {
    id,
    title,
    description: '',
    assigneeId,
    priority,
    due: due === null ? null : inDays(due),
    comments: [],
    attachments: [],
    ...extra
  };
}

const CARDS: Card[] = [
  card('c1', 'Definir paleta e tipografia da loja', 'ana', 'media', -2, {
    description: 'Seguir o manual da marca e validar contraste no modo escuro.',
    attachments: [{ id: 'f1', name: 'manual-da-marca.pdf', size: 3_800_000 }]
  }),
  card('c2', 'Tela de listagem de produtos', 'bruno', 'alta', 3, {
    description: 'Grade responsiva com paginação infinita, foto, preço em R$ e selo de frete grátis.',
    comments: [
      { id: 'k1', authorId: 'ana', text: 'Os protótipos estão na pasta do projeto.', at: ago(2, 10) },
      { id: 'k2', authorId: 'bruno', text: 'Valeu! Começo amanhã cedo.', at: ago(2, 11) }
    ]
  }),
  card('c3', 'Filtro por categoria e faixa de preço', 'bruno', 'media', 6),
  card('c4', 'Integração com o Pix', 'bruno', 'alta', 1, {
    description: 'Gerar QR Code dinâmico e confirmar pagamento pelo webhook do banco.',
    comments: [{ id: 'k3', authorId: 'rafael', text: 'Prioridade máxima desta semana.', at: ago(1, 9) }]
  }),
  card('c5', 'Cálculo de frete por CEP', 'diego', 'media', 8),
  card('c6', 'E-mail de confirmação do pedido', 'camila', 'baixa', 12),
  card('c7', 'Emissão de nota fiscal eletrônica', 'camila', 'alta', 10, {
    attachments: [{ id: 'f2', name: 'requisitos-nfe.docx', size: 210_000 }]
  }),
  card('c8', 'Relatório de vendas por período', 'diego', 'media', null),
  card('c9', 'Revisar política de privacidade (LGPD)', 'rafael', 'baixa', 15),
  card('c10', 'Cadastro de cliente com CPF e endereço', 'ana', 'media', -1)
];

export const INITIAL_DATA: KanbanData = {
  members: MEMBERS,
  cards: Object.fromEntries(CARDS.map((c) => [c.id, c])),
  columns: {
    afazer: { id: 'afazer', title: 'A fazer', cardIds: ['c5', 'c6', 'c8', 'c9'] },
    andamento: { id: 'andamento', title: 'Em andamento', cardIds: ['c4', 'c2', 'c7'] },
    revisao: { id: 'revisao', title: 'Em revisão', cardIds: ['c3', 'c10'] },
    concluido: { id: 'concluido', title: 'Concluído', cardIds: ['c1'] }
  },
  columnOrder: ['afazer', 'andamento', 'revisao', 'concluido'],
  stories: {
    s1: {
      id: 's1',
      code: 1,
      title: 'Como cliente, quero navegar pelo catálogo para encontrar produtos',
      description: 'Vitrine com busca, filtros e cadastro rápido para quem compra pela primeira vez.',
      acceptance: 'Listagem carrega em até 2 s no 4G.\nFiltros combinam categoria e preço.\nCadastro valida o CPF.',
      assigneeId: 'ana',
      priority: 'alta',
      columnId: 'andamento',
      due: inDays(9),
      cardIds: ['c1', 'c2', 'c3', 'c10'],
      comments: [{ id: 'k4', authorId: 'diego', text: 'Os clientes do Nordeste pediram filtro por marca também.', at: ago(3, 15) }]
    },
    s2: {
      id: 's2',
      code: 2,
      title: 'Como cliente, quero pagar e receber meu pedido sem complicação',
      description: 'Checkout com Pix e cartão, frete calculado pelo CEP e confirmação por e-mail.',
      acceptance: 'Pix aprovado em até 10 s.\nFrete aparece antes do pagamento.',
      assigneeId: 'bruno',
      priority: 'alta',
      columnId: 'andamento',
      due: inDays(14),
      cardIds: ['c4', 'c5', 'c6'],
      comments: []
    },
    s3: {
      id: 's3',
      code: 3,
      title: 'Como gestor, quero acompanhar vendas e obrigações fiscais',
      description: 'Painel de vendas e emissão automática das notas.',
      acceptance: 'NF-e emitida a cada pedido pago.\nRelatório exporta para planilha.',
      assigneeId: 'camila',
      priority: 'media',
      columnId: 'afazer',
      due: inDays(21),
      cardIds: ['c7', 'c8'],
      comments: []
    }
  },
  storyOrder: ['s1', 's2', 's3'],
  doneColumnId: 'concluido'
};

export function storyCode(code: number) {
  return `HU-${String(code).padStart(2, '0')}`;
}

export function formatBytes(size: number) {
  const kb = size / 1024;
  if (kb < 1024) return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Math.max(kb, 1))} KB`;
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(kb / 1024)} MB`;
}
