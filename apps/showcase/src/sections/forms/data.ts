// Listas de apoio dos formulários de exemplo (valores fixos, sem sorteio).

export const UFS = [
  'AC',
  'AL',
  'AM',
  'AP',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MG',
  'MS',
  'MT',
  'PA',
  'PB',
  'PE',
  'PI',
  'PR',
  'RJ',
  'RN',
  'RO',
  'RR',
  'RS',
  'SC',
  'SE',
  'SP',
  'TO'
] as const;

export const IDIOMAS = ['Português', 'Inglês', 'Espanhol'] as const;

export const INTERESSES = ['Leitura', 'Corrida', 'Fotografia', 'Culinária'] as const;

export const CARGOS = ['Analista', 'Coordenação', 'Gerência', 'Diretoria'] as const;

export const DEPARTAMENTOS = [
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'operacoes', label: 'Operações' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'rh', label: 'Recursos humanos' }
] as const;

export interface Cidade {
  nome: string;
  uf: string;
}

export const CIDADES: Cidade[] = [
  { nome: 'São Paulo', uf: 'SP' },
  { nome: 'Campinas', uf: 'SP' },
  { nome: 'Rio de Janeiro', uf: 'RJ' },
  { nome: 'Niterói', uf: 'RJ' },
  { nome: 'Belo Horizonte', uf: 'MG' },
  { nome: 'Uberlândia', uf: 'MG' },
  { nome: 'Curitiba', uf: 'PR' },
  { nome: 'Londrina', uf: 'PR' },
  { nome: 'Porto Alegre', uf: 'RS' },
  { nome: 'Florianópolis', uf: 'SC' },
  { nome: 'Joinville', uf: 'SC' },
  { nome: 'Salvador', uf: 'BA' },
  { nome: 'Recife', uf: 'PE' },
  { nome: 'Fortaleza', uf: 'CE' },
  { nome: 'Belém', uf: 'PA' },
  { nome: 'Manaus', uf: 'AM' },
  { nome: 'Goiânia', uf: 'GO' },
  { nome: 'Brasília', uf: 'DF' },
  { nome: 'Natal', uf: 'RN' },
  { nome: 'Vitória', uf: 'ES' }
];

export const TECNOLOGIAS = ['React', 'TypeScript', 'Node.js', 'Rust', 'PostgreSQL', 'Docker', 'Kubernetes', 'Python', 'Go', 'GraphQL'];

export const PLANOS = [
  { value: 'mensal', label: 'Mensal', descricao: 'R$ 49,90 por mês' },
  { value: 'anual', label: 'Anual', descricao: 'R$ 479,00 por ano (2 meses grátis)' },
  { value: 'vitalicio', label: 'Vitalício', descricao: 'Pagamento único de R$ 1.290,00' }
] as const;

/** Itens do pedido mostrado na revisão do assistente. */
export const ITENS_PEDIDO = [
  { nome: 'Cadeira ergonômica', detalhe: 'Tecido grafite', qtd: 1, preco: 1249.9 },
  { nome: 'Suporte para monitor', detalhe: 'Braço articulado duplo', qtd: 1, preco: 389.0 },
  { nome: 'Teclado sem fio', detalhe: 'Layout ABNT2', qtd: 2, preco: 219.5 }
];

export const FRETE = 39.9;
