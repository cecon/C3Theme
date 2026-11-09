// third-party
import { setHours, setMinutes, startOfDay, subDays } from 'date-fns';

import type { Attachment, Message } from '@c3theme/chat';
import type { Tone } from '@c3theme/ui';

export type { Attachment, Message };

export type Presence = 'online' | 'ausente' | 'ocupado' | 'offline';

export const PRESENCE: Record<Presence, { label: string; tone: Tone }> = {
  online: { label: 'Online', tone: 'success' },
  ausente: { label: 'Ausente', tone: 'warning' },
  ocupado: { label: 'Ocupado', tone: 'danger' },
  offline: { label: 'Offline', tone: 'neutral' }
};

export interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  city: string;
  presence: Presence;
  tone: Tone;
  /** Visto por último (só para quem está offline). */
  lastSeen?: string;
}

export const ME = { id: 'me', name: 'Rafael Monteiro', role: 'Gerente de projetos', tone: 'primary' as Tone };

export const CONTACTS: Contact[] = [
  {
    id: 'ana',
    name: 'Ana Beatriz Souza',
    role: 'Designer de produto',
    email: 'ana.souza@exemplo.com.br',
    phone: '(11) 98765-4321',
    city: 'São Paulo, SP',
    presence: 'online',
    tone: 'primary'
  },
  {
    id: 'bruno',
    name: 'Bruno Carvalho',
    role: 'Desenvolvedor front-end',
    email: 'bruno.carvalho@exemplo.com.br',
    phone: '(51) 99812-3344',
    city: 'Porto Alegre, RS',
    presence: 'ocupado',
    tone: 'info'
  },
  {
    id: 'camila',
    name: 'Camila Rocha',
    role: 'Analista financeira',
    email: 'camila.rocha@exemplo.com.br',
    phone: '(71) 98123-5566',
    city: 'Salvador, BA',
    presence: 'ausente',
    tone: 'warning'
  },
  {
    id: 'diego',
    name: 'Diego Martins',
    role: 'Executivo de contas',
    email: 'diego.martins@exemplo.com.br',
    phone: '(81) 99654-7788',
    city: 'Recife, PE',
    presence: 'online',
    tone: 'success'
  },
  {
    id: 'eduarda',
    name: 'Eduarda Lima',
    role: 'Recursos humanos',
    email: 'eduarda.lima@exemplo.com.br',
    phone: '(48) 98877-1122',
    city: 'Florianópolis, SC',
    presence: 'offline',
    tone: 'secondary',
    lastSeen: 'há 2 horas'
  },
  {
    id: 'felipe',
    name: 'Felipe Nogueira',
    role: 'Suporte técnico',
    email: 'felipe.nogueira@exemplo.com.br',
    phone: '(31) 99745-9900',
    city: 'Belo Horizonte, MG',
    presence: 'online',
    tone: 'danger'
  },
  {
    id: 'gabriela',
    name: 'Gabriela Pires',
    role: 'Coordenadora de marketing',
    email: 'gabriela.pires@exemplo.com.br',
    phone: '(41) 98432-6677',
    city: 'Curitiba, PR',
    presence: 'offline',
    tone: 'info',
    lastSeen: 'ontem às 18:40'
  },
  {
    id: 'henrique',
    name: 'Henrique Alves',
    role: 'Advogado',
    email: 'henrique.alves@exemplo.com.br',
    phone: '(61) 99321-4455',
    city: 'Brasília, DF',
    presence: 'ausente',
    tone: 'success'
  }
];

// datas relativas a hoje, calculadas uma vez
const today = startOfDay(new Date());
const at = (daysAgo: number, hour: number, minute: number) => setMinutes(setHours(subDays(today, daysAgo), hour), minute);

type SeedFile = { name: string; size: number };
type Seed = [daysAgo: number, hour: number, minute: number, mine: boolean, text: string, attachments?: SeedFile[]];

const SEEDS: Record<string, Seed[]> = {
  ana: [
    [2, 10, 5, false, 'Oi, Rafael! Terminei a primeira versão das telas de cadastro.'],
    [2, 10, 7, true, 'Que ótimo! Pode mandar o link que eu reviso ainda hoje.'],
    [2, 10, 9, false, 'Segue o arquivo com os fluxos principais.', [{ name: 'fluxo-cadastro-v1.pdf', size: 2_340_000 }]],
    [1, 9, 15, true, 'Revisei tudo. Só achei que o botão de voltar está pouco visível no celular.'],
    [1, 9, 20, false, 'Boa observação, vou ajustar o contraste.'],
    [0, 8, 47, false, 'Bom dia! Subi a versão corrigida 😊'],
    [0, 8, 52, true, 'Ficou bem melhor.\nPodemos apresentar para o cliente na quinta?'],
    [0, 9, 3, false, 'Fechado! Vou preparar a apresentação.']
  ],
  bruno: [
    [3, 14, 30, true, 'Bruno, como está a integração com o gateway de pagamento?'],
    [3, 15, 2, false, 'Quase pronta. Falta só tratar o retorno do Pix.'],
    [0, 11, 20, false, 'Deploy em homologação feito. Pode testar quando puder.']
  ],
  camila: [
    [1, 16, 10, false, 'O relatório de despesas de setembro está anexado.', [{ name: 'despesas-setembro.xlsx', size: 486_000 }]],
    [1, 16, 30, true, 'Obrigado, Camila! O total bateu com o orçamento?'],
    [1, 16, 41, false, 'Ficamos R$ 3.200,00 abaixo do previsto 🎉']
  ],
  diego: [
    [5, 9, 0, false, 'A Araucária Têxtil pediu uma nova proposta.'],
    [5, 9, 12, true, 'Pode enviar com 8% de desconto à vista.'],
    [0, 7, 55, false, 'Contrato assinado! Chegou agora há pouco.']
  ],
  eduarda: [[4, 13, 5, false, 'Lembrete: a integração dos novos colaboradores é na segunda às 9h.']],
  felipe: [
    [6, 17, 22, true, 'Felipe, o chamado 4821 foi resolvido?'],
    [6, 17, 40, false, 'Sim, era configuração de DNS do cliente.']
  ],
  gabriela: [[8, 10, 0, false, 'Mandei o calendário de posts de novembro para aprovação.']],
  henrique: []
};

const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

/** Histórico inicial de todas as conversas, no contrato do @c3theme/chat (a conversa é o id do contato). */
export const SEED_MESSAGES: Message[] = Object.entries(SEEDS).flatMap(([contactId, seeds]) =>
  seeds.map(([daysAgo, h, m, mine, text, files], i) => {
    const contact = CONTACTS.find((c) => c.id === contactId)!;
    return {
      id: `${contactId}-${i}`,
      conversationId: contactId,
      author: mine ? { id: ME.id, name: ME.name } : { id: contact.id, name: contact.name },
      direction: mine ? 'out' : 'in',
      text,
      createdAt: at(daysAgo, h, m).toISOString(),
      status: mine ? 'read' : undefined,
      attachments: files?.map((f, j) => ({
        id: `${contactId}-${i}-${j}`,
        ...f,
        contentType: CONTENT_TYPES[f.name.split('.').pop() ?? ''] ?? 'application/octet-stream'
      }))
    } satisfies Message;
  })
);

export const INITIAL_UNREAD: Record<string, number> = { bruno: 1, diego: 1, camila: 2 };

/** Respostas automáticas da demonstração, usadas em ordem. */
export const AUTO_REPLIES = [
  'Combinado! 👍',
  'Entendi, vou verificar e te retorno.',
  'Perfeito, obrigado pelo aviso.',
  'Pode deixar comigo.',
  'Faz sentido. Vamos alinhar na próxima reunião?'
];

// prettier-ignore
export const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😎',
  '🤔', '😅', '😉', '🙃', '😢', '😭', '😡', '😴',
  '👍', '👎', '👏', '🙌', '🙏', '💪', '🤝', '👋',
  '❤️', '💙', '💚', '🔥', '⭐', '✨', '🎉', '🎂',
  '✅', '❌', '⚠️', '💡', '📌', '📎', '📅', '☕'
];

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  const kb = size / 1024;
  if (kb < 1024) return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(kb)} KB`;
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(kb / 1024)} MB`;
}
