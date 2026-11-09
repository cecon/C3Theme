import type { StatusTone } from '@c3theme/ui';

export type CustomerStatus = 'ativo' | 'pendente' | 'inativo';

export interface Customer {
  id: number;
  nome: string;
  email: string;
  /** Só dígitos (11). */
  telefone: string;
  /** Só dígitos (11). */
  cpf: string;
  idade: number;
  cidade: string;
  uf: string;
  cargo: string;
  status: CustomerStatus;
  /** Data de cadastro (ISO). */
  desde: string;
  pedidos: number;
  totalGasto: number;
  sobre: string;
  interesses: string[];
  /** Foto enviada pelo usuário (data URL). Sem foto mostra as iniciais. */
  foto?: string;
}

export const STATUS: Record<CustomerStatus, { label: string; tone: StatusTone }> = {
  ativo: { label: 'Ativo', tone: 'success' },
  pendente: { label: 'Pendente', tone: 'warning' },
  inativo: { label: 'Inativo', tone: 'danger' }
};

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
];

export const INTERESSES = [
  'Tecnologia',
  'Esportes',
  'Casa e decoração',
  'Moda',
  'Livros',
  'Games',
  'Viagens',
  'Culinária',
  'Música',
  'Pets'
];

const PRIMEIROS = [
  'Ana',
  'Bruno',
  'Carla',
  'Diego',
  'Elisa',
  'Fábio',
  'Gabriela',
  'Heitor',
  'Isabela',
  'João',
  'Larissa',
  'Marcelo',
  'Natália',
  'Otávio',
  'Patrícia',
  'Rafael',
  'Sabrina',
  'Thiago',
  'Vanessa',
  'Wagner',
  'Yasmin',
  'Lucas',
  'Mariana',
  'Pedro',
  'Juliana',
  'Renato',
  'Camila',
  'Eduardo',
  'Letícia',
  'Gustavo'
];
const SOBRENOMES = [
  'Silva',
  'Souza',
  'Oliveira',
  'Pereira',
  'Costa',
  'Rodrigues',
  'Almeida',
  'Nascimento',
  'Lima',
  'Araújo',
  'Ferreira',
  'Barbosa',
  'Ribeiro',
  'Carvalho',
  'Gomes',
  'Martins',
  'Rocha'
];
const CIDADES: [string, string][] = [
  ['São Paulo', 'SP'],
  ['Rio de Janeiro', 'RJ'],
  ['Belo Horizonte', 'MG'],
  ['Curitiba', 'PR'],
  ['Porto Alegre', 'RS'],
  ['Salvador', 'BA'],
  ['Recife', 'PE'],
  ['Fortaleza', 'CE'],
  ['Florianópolis', 'SC'],
  ['Goiânia', 'GO'],
  ['Brasília', 'DF'],
  ['Manaus', 'AM'],
  ['Belém', 'PA'],
  ['Campinas', 'SP'],
  ['Vitória', 'ES'],
  ['Natal', 'RN']
];
const CARGOS = [
  'Analista financeira',
  'Engenheiro de software',
  'Designer de produto',
  'Professora',
  'Médico veterinário',
  'Arquiteta',
  'Gerente de vendas',
  'Advogado',
  'Nutricionista',
  'Empreendedor',
  'Contadora',
  'Fotógrafo'
];
const FRASES = [
  'Compra com frequência e costuma avaliar os produtos depois da entrega.',
  'Prefere receber novidades por e-mail e aproveita as campanhas de fim de mês.',
  'Cliente desde a primeira loja física; migrou para o online em busca de praticidade.',
  'Faz pedidos grandes no começo de cada trimestre para o escritório.',
  'Gosta de comparar especificações antes de fechar a compra e pede nota fiscal sempre.',
  'Participa do programa de pontos e já indicou outros clientes.'
];
const STATUSES: CustomerStatus[] = ['ativo', 'ativo', 'pendente', 'ativo', 'inativo', 'ativo', 'pendente'];

/** Dígitos verificadores de CPF, para os números fictícios terem formato válido. */
function cpfDigits(base: string) {
  const calc = (s: string) => {
    const sum = s.split('').reduce((acc, d, i) => acc + Number(d) * (s.length + 1 - i), 0);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = calc(base);
  return `${base}${d1}${calc(base + d1)}`;
}

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function makeCustomer(i: number): Customer {
  const first = PRIMEIROS[i % PRIMEIROS.length];
  const last = SOBRENOMES[(i * 7) % SOBRENOMES.length];
  const [cidade, uf] = CIDADES[(i * 5) % CIDADES.length];
  const ddd =
    {
      SP: '11',
      RJ: '21',
      MG: '31',
      PR: '41',
      RS: '51',
      BA: '71',
      PE: '81',
      CE: '85',
      SC: '48',
      GO: '62',
      DF: '61',
      AM: '92',
      PA: '91',
      ES: '27',
      RN: '84'
    }[uf] ?? '11';
  const month = (i * 3) % 12;
  return {
    id: i + 1,
    nome: `${first} ${last}`,
    email: `${slug(first)}.${slug(last)}${i > 29 ? i : ''}@exemplo.com.br`,
    telefone: `${ddd}9${String(81234567 + i * 104729).slice(-8)}`,
    cpf: cpfDigits(
      String(123456789 + i * 7654321)
        .slice(-9)
        .padStart(9, '1')
    ),
    idade: 21 + ((i * 13) % 45),
    cidade,
    uf,
    cargo: CARGOS[(i * 5) % CARGOS.length],
    status: STATUSES[i % STATUSES.length],
    desde: new Date(2021 + (i % 5), month, 1 + ((i * 11) % 27)).toISOString(),
    pedidos: (i * 17) % 60,
    totalGasto: ((i * 7919) % 25000) + 180.5,
    sobre: FRASES[i % FRASES.length],
    interesses: [INTERESSES[i % INTERESSES.length], INTERESSES[(i * 3 + 1) % INTERESSES.length]].filter((v, k, a) => a.indexOf(v) === k)
  };
}

export const SEED_CUSTOMERS: Customer[] = Array.from({ length: 42 }, (_, i) => makeCustomer(i));

export const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatCpf = (v: string) => v.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
export const formatPhone = (v: string) => v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
