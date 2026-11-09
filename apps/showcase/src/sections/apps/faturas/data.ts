import type { StatusTone } from '@c3theme/ui';

// third-party
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

export type InvoiceStatus = 'paga' | 'pendente' | 'vencida' | 'cancelada';

export interface Address {
  street: string;
  district: string;
  city: string;
  state: string;
  zip: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  /** CPF ou CNPJ (fictícios). */
  document: string;
  address: Address;
}

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  /** Datas em ISO (aaaa-mm-dd). */
  issueDate: string;
  dueDate: string;
  customer: Customer;
  billing: Address;
  shipping: Address;
  lines: InvoiceLine[];
  /** Percentuais sobre o subtotal. */
  discount: number;
  tax: number;
  notes: string;
}

export const STATUS: Record<InvoiceStatus, { label: string; tone: StatusTone }> = {
  paga: { label: 'Paga', tone: 'success' },
  pendente: { label: 'Pendente', tone: 'warning' },
  vencida: { label: 'Vencida', tone: 'danger' },
  cancelada: { label: 'Cancelada', tone: 'neutral' }
};

/** Quem emite as faturas (aparece no documento). */
export const ISSUER = {
  name: 'C3 Soluções Digitais Ltda.',
  document: '12.345.678/0001-90',
  email: 'financeiro@c3solucoes.com.br',
  phone: '(11) 3456-7890',
  address: { street: 'Av. Paulista, 1500, conj. 82', district: 'Bela Vista', city: 'São Paulo', state: 'SP', zip: '01310-200' }
};

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const money = (value: number) => brl.format(value);
export const shortDate = (iso: string) => format(parseISO(iso), 'dd/MM/yyyy', { locale: ptBR });
export const longDate = (iso: string) => format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
export const addressLine = (a: Address) => `${a.street} – ${a.district}, ${a.city}/${a.state} – CEP ${a.zip}`;

export function totals(lines: Pick<InvoiceLine, 'quantity' | 'price'>[], discount: number, tax: number) {
  const subtotal = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.price) || 0), 0);
  const discountValue = (subtotal * (Number(discount) || 0)) / 100;
  const taxValue = ((subtotal - discountValue) * (Number(tax) || 0)) / 100;
  return { subtotal, discountValue, taxValue, total: subtotal - discountValue + taxValue };
}

export const invoiceTotal = (i: Invoice) => totals(i.lines, i.discount, i.tax).total;

export const CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Padaria Pão de Mel',
    email: 'contato@paodemel.com.br',
    phone: '(31) 3222-1010',
    document: '23.456.789/0001-01',
    address: { street: 'Rua da Bahia, 820', district: 'Centro', city: 'Belo Horizonte', state: 'MG', zip: '30160-011' }
  },
  {
    id: 'c2',
    name: 'Mariana Costa',
    email: 'mariana.costa@email.com',
    phone: '(21) 99812-3344',
    document: '123.456.789-09',
    address: {
      street: 'Rua Voluntários da Pátria, 45, ap. 302',
      district: 'Botafogo',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zip: '22270-000'
    }
  },
  {
    id: 'c3',
    name: 'Oficina Mecânica Rota Sul',
    email: 'financeiro@rotasul.com.br',
    phone: '(51) 3333-4455',
    document: '34.567.890/0001-12',
    address: { street: 'Av. Ipiranga, 3200', district: 'Partenon', city: 'Porto Alegre', state: 'RS', zip: '90610-000' }
  },
  {
    id: 'c4',
    name: 'Clínica Vida Plena',
    email: 'adm@vidaplena.med.br',
    phone: '(41) 3011-2200',
    document: '45.678.901/0001-23',
    address: { street: 'Rua XV de Novembro, 1200', district: 'Centro', city: 'Curitiba', state: 'PR', zip: '80060-000' }
  },
  {
    id: 'c5',
    name: 'Rafael Lima',
    email: 'rafael.lima@email.com',
    phone: '(81) 98765-4321',
    document: '987.654.321-00',
    address: { street: 'Rua do Bom Jesus, 77', district: 'Recife Antigo', city: 'Recife', state: 'PE', zip: '50030-170' }
  },
  {
    id: 'c6',
    name: 'Livraria Página Viva',
    email: 'compras@paginaviva.com.br',
    phone: '(71) 3321-9090',
    document: '56.789.012/0001-34',
    address: { street: 'Av. Sete de Setembro, 510', district: 'Dois de Julho', city: 'Salvador', state: 'BA', zip: '40060-001' }
  },
  {
    id: 'c7',
    name: 'Construtora Horizonte',
    email: 'contas@horizonte.eng.br',
    phone: '(62) 3255-6677',
    document: '67.890.123/0001-45',
    address: { street: 'Av. T-63, 1400', district: 'Setor Bueno', city: 'Goiânia', state: 'GO', zip: '74230-100' }
  },
  {
    id: 'c8',
    name: 'Beatriz Almeida',
    email: 'bia.almeida@email.com',
    phone: '(85) 99654-1122',
    document: '456.789.123-45',
    address: { street: 'Av. Beira Mar, 2900, ap. 1101', district: 'Meireles', city: 'Fortaleza', state: 'CE', zip: '60165-121' }
  },
  {
    id: 'c9',
    name: 'Escola Aprender Mais',
    email: 'secretaria@aprendermais.edu.br',
    phone: '(48) 3224-5566',
    document: '78.901.234/0001-56',
    address: { street: 'Rua Felipe Schmidt, 300', district: 'Centro', city: 'Florianópolis', state: 'SC', zip: '88010-000' }
  },
  {
    id: 'c10',
    name: 'Mercadinho Bom Preço',
    email: 'gerencia@bompreco.com.br',
    phone: '(92) 3631-7788',
    document: '89.012.345/0001-67',
    address: { street: 'Av. Eduardo Ribeiro, 640', district: 'Centro', city: 'Manaus', state: 'AM', zip: '69010-001' }
  }
];

const SERVICES: [string, number][] = [
  ['Desenvolvimento de site institucional', 4800],
  ['Manutenção mensal do sistema', 890],
  ['Hospedagem anual com SSL', 640],
  ['Consultoria em processos (hora)', 220],
  ['Licença do módulo financeiro', 1290],
  ['Treinamento da equipe (turma)', 1500],
  ['Integração com emissor de NF-e', 2350],
  ['Suporte prioritário (mês)', 450],
  ['Identidade visual e logotipo', 2600],
  ['Campanha de mídia paga (gestão)', 1100]
];

const STATUS_CYCLE: InvoiceStatus[] = [
  'paga',
  'pendente',
  'paga',
  'vencida',
  'paga',
  'pendente',
  'cancelada',
  'paga',
  'vencida',
  'pendente'
];
const NOTES = [
  'Pagamento via Pix ou boleto. Após o vencimento, multa de 2% e juros de 1% ao mês.',
  'Obrigado pela parceria! Qualquer dúvida, fale com o financeiro.',
  ''
];

const pad = (n: number) => String(n).padStart(2, '0');

/** 28 faturas geradas a partir do índice: sempre as mesmas. */
export const SEED_INVOICES: Invoice[] = Array.from({ length: 28 }, (_, i) => {
  const customer = CUSTOMERS[(i * 3) % CUSTOMERS.length]!;
  const month = 10 - Math.floor(i / 3); // de outubro de 2026 para trás
  const year = month > 0 ? 2026 : 2025;
  const m = month > 0 ? month : month + 12;
  const day = 1 + ((i * 7) % 27);
  const issueDate = `${year}-${pad(m)}-${pad(day)}`;
  const due = new Date(year, m - 1, day + 15 + (i % 3) * 15);
  const dueDate = `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}`;
  const count = 1 + (i % 4);
  const lines: InvoiceLine[] = Array.from({ length: count }, (_, j) => {
    const [description, price] = SERVICES[(i + j * 3) % SERVICES.length]!;
    return { id: `l${i}-${j}`, description, quantity: 1 + ((i + j) % 3), price };
  });
  return {
    id: String(1028 - i),
    number: `FAT-${year}-${1028 - i}`,
    status: STATUS_CYCLE[i % STATUS_CYCLE.length]!,
    issueDate,
    dueDate,
    customer,
    billing: customer.address,
    shipping: customer.address,
    lines,
    discount: [0, 5, 0, 10][i % 4]!,
    tax: [0, 6, 11][i % 3]!,
    notes: NOTES[i % NOTES.length]!
  };
});
