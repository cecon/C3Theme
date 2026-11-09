// Lojas e entregas para o mapa.

// ---------- mapa ----------

export interface Loja {
  id: string;
  nome: string;
  cidade: string;
  uf: string;
  endereco: string;
  lng: number;
  lat: number;
  /** Faturamento do mês, em reais. */
  vendas: number;
  aberta: boolean;
}

export const LOJAS: Loja[] = [
  {
    id: 'sp',
    nome: 'Loja Paulista',
    cidade: 'São Paulo',
    uf: 'SP',
    endereco: 'Av. Paulista, 1500',
    lng: -46.6566,
    lat: -23.5614,
    vendas: 486200,
    aberta: true
  },
  {
    id: 'rj',
    nome: 'Loja Botafogo',
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    endereco: 'Praia de Botafogo, 400',
    lng: -43.1822,
    lat: -22.9486,
    vendas: 352900,
    aberta: true
  },
  {
    id: 'bh',
    nome: 'Loja Savassi',
    cidade: 'Belo Horizonte',
    uf: 'MG',
    endereco: 'Rua Pernambuco, 1000',
    lng: -43.9352,
    lat: -19.9373,
    vendas: 241300,
    aberta: true
  },
  {
    id: 'cwb',
    nome: 'Loja Batel',
    cidade: 'Curitiba',
    uf: 'PR',
    endereco: 'Av. do Batel, 1868',
    lng: -49.2873,
    lat: -25.4419,
    vendas: 198700,
    aberta: true
  },
  {
    id: 'poa',
    nome: 'Loja Moinhos',
    cidade: 'Porto Alegre',
    uf: 'RS',
    endereco: 'Rua Padre Chagas, 300',
    lng: -51.2017,
    lat: -30.0262,
    vendas: 176400,
    aberta: false
  },
  {
    id: 'ssa',
    nome: 'Loja Barra',
    cidade: 'Salvador',
    uf: 'BA',
    endereco: 'Av. Oceânica, 200',
    lng: -38.5262,
    lat: -13.0096,
    vendas: 163800,
    aberta: true
  },
  {
    id: 'rec',
    nome: 'Loja Boa Viagem',
    cidade: 'Recife',
    uf: 'PE',
    endereco: 'Av. Boa Viagem, 3000',
    lng: -34.8963,
    lat: -8.1192,
    vendas: 158200,
    aberta: true
  },
  {
    id: 'for',
    nome: 'Loja Meireles',
    cidade: 'Fortaleza',
    uf: 'CE',
    endereco: 'Av. Beira Mar, 2500',
    lng: -38.4962,
    lat: -3.7253,
    vendas: 149900,
    aberta: true
  },
  {
    id: 'bsb',
    nome: 'Loja Asa Sul',
    cidade: 'Brasília',
    uf: 'DF',
    endereco: 'SCLS 405, bloco B',
    lng: -47.8885,
    lat: -15.8127,
    vendas: 211500,
    aberta: true
  },
  {
    id: 'mao',
    nome: 'Loja Adrianópolis',
    cidade: 'Manaus',
    uf: 'AM',
    endereco: 'Av. Mário Ypiranga, 1300',
    lng: -60.0107,
    lat: -3.1019,
    vendas: 97600,
    aberta: false
  },
  {
    id: 'bel',
    nome: 'Loja Nazaré',
    cidade: 'Belém',
    uf: 'PA',
    endereco: 'Av. Nazaré, 800',
    lng: -48.4836,
    lat: -1.4517,
    vendas: 88300,
    aberta: true
  },
  {
    id: 'gyn',
    nome: 'Loja Setor Bueno',
    cidade: 'Goiânia',
    uf: 'GO',
    endereco: 'Av. T-10, 500',
    lng: -49.2731,
    lat: -16.7029,
    vendas: 121400,
    aberta: true
  }
];

/** Pedidos entregues por cidade no mês (peso do mapa de calor). */
export const ENTREGAS: [number, number, number][] = [
  [-46.63, -23.55, 980],
  [-46.53, -23.65, 420],
  [-47.06, -22.9, 380],
  [-45.88, -23.18, 210],
  [-47.81, -21.17, 190],
  [-43.2, -22.9, 760],
  [-43.1, -22.88, 260],
  [-43.94, -19.92, 540],
  [-48.27, -18.91, 150],
  [-49.27, -25.43, 460],
  [-51.16, -23.3, 170],
  [-48.55, -27.59, 300],
  [-48.85, -26.3, 190],
  [-51.23, -30.03, 410],
  [-51.18, -29.17, 140],
  [-38.5, -12.97, 380],
  [-34.88, -8.05, 350],
  [-38.54, -3.73, 330],
  [-35.21, -5.79, 140],
  [-34.86, -7.12, 120],
  [-47.88, -15.79, 420],
  [-49.25, -16.68, 260],
  [-60.02, -3.12, 160],
  [-48.49, -1.45, 150],
  [-44.3, -2.53, 90],
  [-42.8, -5.09, 80],
  [-54.62, -20.47, 110],
  [-56.1, -15.6, 100],
  [-40.31, -20.32, 170]
];
