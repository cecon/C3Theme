// Produto: tipos, categorias, cores e formas da arte.

export type ArtShape =
  | 'fone'
  | 'relogio'
  | 'tenis'
  | 'camiseta'
  | 'mochila'
  | 'caneca'
  | 'luminaria'
  | 'oculos'
  | 'garrafa'
  | 'teclado'
  | 'bola'
  | 'vaso'
  | 'bone'
  | 'caixaSom'
  | 'tapete';

export interface Product {
  id: number;
  nome: string;
  sku: string;
  categoria: CategoryId;
  marca: string;
  preco: number;
  /** Preço "de", quando está em promoção. */
  precoAntigo?: number;
  estoque: number;
  cores: ColorId[];
  tamanhos?: string[];
  forma: ArtShape;
  resumo: string;
  descricao: string;
  destaques: string[];
  especificacoes: [string, string][];
  /** Quantas avaliações de 5 a 1 estrela. */
  notas: [number, number, number, number, number];
  criadoEm: string;
  /** Fotos enviadas no cadastro (data URL). Sem fotos, a vitrine desenha a ilustração. */
  imagens?: string[];
}

export const CATEGORIES = {
  eletronicos: 'Eletrônicos',
  moda: 'Moda',
  casa: 'Casa',
  esportes: 'Esportes',
  acessorios: 'Acessórios'
} as const;
export type CategoryId = keyof typeof CATEGORIES;

// as cores são o próprio dado do produto (por isso os hex)
export const COLORS = {
  preto: { nome: 'Preto', hex: '#2b2f36' },
  branco: { nome: 'Branco', hex: '#eef0f3' },
  azul: { nome: 'Azul', hex: '#2f6fde' },
  verde: { nome: 'Verde', hex: '#2e9e5b' },
  vermelho: { nome: 'Vermelho', hex: '#d64545' },
  amarelo: { nome: 'Amarelo', hex: '#e8b324' },
  rosa: { nome: 'Rosa', hex: '#e06aa5' },
  cinza: { nome: 'Cinza', hex: '#8d96a3' },
  terracota: { nome: 'Terracota', hex: '#c46a3f' }
} as const;
export type ColorId = keyof typeof COLORS;

export const SHAPES: Record<ArtShape, string> = {
  fone: 'Fone',
  relogio: 'Relógio',
  tenis: 'Tênis',
  camiseta: 'Roupa',
  mochila: 'Mochila',
  caneca: 'Caneca',
  luminaria: 'Luminária',
  oculos: 'Óculos',
  garrafa: 'Garrafa',
  teclado: 'Teclado',
  bola: 'Bola',
  vaso: 'Vaso',
  bone: 'Boné',
  caixaSom: 'Caixa de som',
  tapete: 'Tapete'
};

export interface Seed {
  nome: string;
  categoria: CategoryId;
  marca: string;
  preco: number;
  precoAntigo?: number;
  estoque: number;
  cores: ColorId[];
  tamanhos?: string[];
  forma: ArtShape;
  resumo: string;
  destaques: string[];
  especificacoes: [string, string][];
}
