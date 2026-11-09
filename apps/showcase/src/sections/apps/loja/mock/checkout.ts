// Checkout: moeda, cupons, frete e endereços.

export const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export interface Coupon {
  codigo: string;
  descricao: string;
  /** Desconto sobre o subtotal. */
  desconto: (subtotal: number) => number;
  freteGratis?: boolean;
  minimo?: number;
}

export const COUPONS: Coupon[] = [
  { codigo: 'C3DEZ', descricao: '10% de desconto em todo o carrinho', desconto: (s) => s * 0.1 },
  { codigo: 'BEMVINDO', descricao: 'R$ 25 de desconto em compras acima de R$ 150', desconto: () => 25, minimo: 150 },
  { codigo: 'FRETEGRATIS', descricao: 'Frete padrão grátis', desconto: () => 0, freteGratis: true }
];

export const SHIPPING = {
  padrao: { nome: 'Entrega padrão', prazo: '5 a 8 dias úteis', preco: 19.9 },
  expressa: { nome: 'Entrega expressa', prazo: '1 a 2 dias úteis', preco: 39.9 }
} as const;
export type ShippingId = keyof typeof SHIPPING;
/** Acima deste subtotal a entrega padrão sai de graça. */
export const FREE_SHIPPING_FROM = 299;

export interface Address {
  id: number;
  apelido: string;
  destinatario: string;
  telefone: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export const SEED_ADDRESSES: Address[] = [
  {
    id: 1,
    apelido: 'Casa',
    destinatario: 'Ana Souza',
    telefone: '11987654321',
    cep: '01310100',
    rua: 'Avenida Paulista',
    numero: '1000',
    complemento: 'Apto 52',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP'
  },
  {
    id: 2,
    apelido: 'Trabalho',
    destinatario: 'Ana Souza',
    telefone: '11912345678',
    cep: '04538133',
    rua: 'Avenida Brigadeiro Faria Lima',
    numero: '3477',
    bairro: 'Itaim Bibi',
    cidade: 'São Paulo',
    uf: 'SP'
  }
];

export const formatCep = (v: string) => v.replace(/^(\d{5})(\d{3})$/, '$1-$2');
