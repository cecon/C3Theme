// Dados de exemplo das tabelas: gerados por uma função com semente fixa, sempre iguais a cada carga.

export type Departamento = 'Financeiro' | 'Comercial' | 'Tecnologia' | 'Pessoas' | 'Operações' | 'Marketing' | 'Jurídico';
export type Situacao = 'Ativo' | 'Férias' | 'Afastado' | 'Desligado';

export interface Pessoa {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  cidade: string;
  uf: string;
  departamento: Departamento;
  cargo: string;
  idade: number;
  salario: number;
  situacao: Situacao;
  /** Data ISO (aaaa-mm-dd). */
  admissao: string;
  /** Meta do trimestre cumprida, de 0 a 100. */
  progresso: number;
  /** Equipe direta (usada nas tabelas expansíveis). */
  equipe?: Pessoa[];
}

export type SituacaoPedido = 'Pago' | 'Pendente' | 'Enviado' | 'Cancelado';

export interface Pedido {
  numero: string;
  data: string;
  produto: string;
  quantidade: number;
  valorUnitario: number;
  situacao: SituacaoPedido;
}

/** Gerador pseudoaleatório mulberry32: mesma semente, mesma sequência. */
export function criarSorteio(semente: number) {
  let s = semente >>> 0;
  const proximo = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    proximo,
    inteiro: (min: number, max: number) => min + Math.floor(proximo() * (max - min + 1)),
    item: <T>(lista: readonly T[]): T => lista[Math.floor(proximo() * lista.length)]
  };
}

const PRENOMES = [
  'Ana',
  'Bruno',
  'Camila',
  'Diego',
  'Eduarda',
  'Felipe',
  'Gabriela',
  'Heitor',
  'Isabela',
  'João',
  'Larissa',
  'Marcos',
  'Natália',
  'Otávio',
  'Paula',
  'Rafael',
  'Sofia',
  'Thiago',
  'Valentina',
  'Vinícius',
  'Beatriz',
  'Caio',
  'Débora',
  'Enzo',
  'Fernanda',
  'Gustavo',
  'Helena',
  'Igor',
  'Juliana',
  'Lucas',
  'Mariana',
  'Nicolas',
  'Patrícia',
  'Renato',
  'Simone',
  'Tatiane',
  'Ulisses',
  'Vitória',
  'Wagner',
  'Yasmin'
] as const;

const SOBRENOMES = [
  'Almeida',
  'Barbosa',
  'Cardoso',
  'Costa',
  'Dias',
  'Fernandes',
  'Gomes',
  'Lima',
  'Machado',
  'Martins',
  'Melo',
  'Moreira',
  'Nascimento',
  'Oliveira',
  'Pereira',
  'Ribeiro',
  'Rocha',
  'Santos',
  'Silva',
  'Souza',
  'Teixeira',
  'Vieira',
  'Araújo',
  'Batista',
  'Campos',
  'Freitas',
  'Monteiro',
  'Nogueira',
  'Pinto',
  'Ramos'
] as const;

const CIDADES = [
  ['São Paulo', 'SP', 11],
  ['Campinas', 'SP', 19],
  ['Rio de Janeiro', 'RJ', 21],
  ['Niterói', 'RJ', 21],
  ['Belo Horizonte', 'MG', 31],
  ['Uberlândia', 'MG', 34],
  ['Curitiba', 'PR', 41],
  ['Londrina', 'PR', 43],
  ['Porto Alegre', 'RS', 51],
  ['Caxias do Sul', 'RS', 54],
  ['Florianópolis', 'SC', 48],
  ['Joinville', 'SC', 47],
  ['Salvador', 'BA', 71],
  ['Recife', 'PE', 81],
  ['Fortaleza', 'CE', 85],
  ['Natal', 'RN', 84],
  ['Belém', 'PA', 91],
  ['Manaus', 'AM', 92],
  ['Goiânia', 'GO', 62],
  ['Brasília', 'DF', 61]
] as const;

export const DEPARTAMENTOS: Departamento[] = ['Financeiro', 'Comercial', 'Tecnologia', 'Pessoas', 'Operações', 'Marketing', 'Jurídico'];

const CARGOS: Record<Departamento, readonly string[]> = {
  Financeiro: ['Analista financeiro', 'Controller', 'Assistente de contas', 'Tesoureiro'],
  Comercial: ['Executivo de vendas', 'Representante', 'Gerente de contas', 'Pré-vendas'],
  Tecnologia: ['Desenvolvedor', 'Analista de dados', 'Engenheiro de software', 'Analista de suporte'],
  Pessoas: ['Analista de RH', 'Recrutador', 'Business partner', 'Assistente de DP'],
  Operações: ['Coordenador de logística', 'Comprador', 'Analista de processos', 'Supervisor'],
  Marketing: ['Designer', 'Analista de mídia', 'Redator', 'Coordenador de marca'],
  Jurídico: ['Advogado', 'Paralegal', 'Analista de contratos', 'Assistente jurídico']
};

const SALARIO_BASE: Record<Departamento, number> = {
  Financeiro: 6200,
  Comercial: 5400,
  Tecnologia: 8300,
  Pessoas: 5000,
  Operações: 4700,
  Marketing: 5200,
  Jurídico: 7600
};

export const SITUACOES: Situacao[] = ['Ativo', 'Férias', 'Afastado', 'Desligado'];

const PRODUTOS = [
  ['Cadeira ergonômica', 1290],
  ['Monitor 27"', 1890],
  ['Teclado mecânico', 459],
  ['Headset sem fio', 389],
  ['Notebook 14"', 5490],
  ['Mesa regulável', 2350],
  ['Webcam Full HD', 279],
  ['Dock USB-C', 649],
  ['Mouse vertical', 199],
  ['Licença anual de software', 980]
] as const;

/** CPF fictício com dígitos verificadores válidos. */
function gerarCpf(sorteio: ReturnType<typeof criarSorteio>) {
  const d = Array.from({ length: 9 }, () => sorteio.inteiro(0, 9));
  const dv = (base: number[]) => {
    const soma = base.reduce((acc, n, i) => acc + n * (base.length + 1 - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  d.push(dv(d));
  d.push(dv(d));
  const s = d.join('');
  return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}`;
}

function semAcento(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Gera `quantidade` pessoas a partir da semente. */
export function gerarPessoas(quantidade: number, semente = 2024): Pessoa[] {
  const sorteio = criarSorteio(semente);
  return Array.from({ length: quantidade }, (_, i) => {
    const prenome = sorteio.item(PRENOMES);
    const sobrenome = sorteio.item(SOBRENOMES);
    const [cidade, uf, ddd] = sorteio.item(CIDADES);
    const departamento = sorteio.item(DEPARTAMENTOS);
    const idade = sorteio.inteiro(19, 64);
    const senioridade = 1 + Math.min(idade - 19, 30) / 25 + sorteio.proximo() * 0.6;
    const ano = sorteio.inteiro(2012, 2025);
    const mes = String(sorteio.inteiro(1, 12)).padStart(2, '0');
    const dia = String(sorteio.inteiro(1, 28)).padStart(2, '0');
    const r = sorteio.proximo();
    const situacao: Situacao = r < 0.68 ? 'Ativo' : r < 0.82 ? 'Férias' : r < 0.92 ? 'Afastado' : 'Desligado';
    const usuario = semAcento(`${prenome}.${sobrenome}`).toLowerCase();
    return {
      id: i + 1,
      nome: `${prenome} ${sobrenome}`,
      email: `${usuario}${i % 7 === 0 ? i : ''}@exemplo.com.br`,
      cpf: gerarCpf(sorteio),
      telefone: `(${ddd}) 9${sorteio.inteiro(1000, 9999)}-${sorteio.inteiro(1000, 9999)}`,
      cidade,
      uf,
      departamento,
      cargo: sorteio.item(CARGOS[departamento]),
      idade,
      salario: Math.round((SALARIO_BASE[departamento] * senioridade) / 10) * 10,
      situacao,
      admissao: `${ano}-${mes}-${dia}`,
      progresso: sorteio.inteiro(8, 100)
    };
  });
}

/** Base principal das tabelas: 120 pessoas. */
export const PESSOAS: Pessoa[] = gerarPessoas(120);

/** Pedidos de uma pessoa (subtabelas e linhas recolhíveis). */
export function pedidosDe(pessoaId: number): Pedido[] {
  const sorteio = criarSorteio(pessoaId * 7919);
  const total = sorteio.inteiro(2, 5);
  return Array.from({ length: total }, (_, i) => {
    const [produto, preco] = sorteio.item(PRODUTOS);
    const r = sorteio.proximo();
    return {
      numero: `PED-${String(pessoaId * 100 + i + 1).padStart(6, '0')}`,
      data: `2025-${String(sorteio.inteiro(1, 12)).padStart(2, '0')}-${String(sorteio.inteiro(1, 28)).padStart(2, '0')}`,
      produto,
      quantidade: sorteio.inteiro(1, 6),
      valorUnitario: preco,
      situacao: r < 0.45 ? 'Pago' : r < 0.7 ? 'Enviado' : r < 0.9 ? 'Pendente' : 'Cancelado'
    };
  });
}

/**
 * Organograma para a tabela expansível: 6 gestores, cada um com uma equipe,
 * e alguns membros da equipe com a própria equipe (3 níveis).
 */
export function gerarOrganograma(): Pessoa[] {
  const base = gerarPessoas(60, 77);
  let cursor = 6;
  const pegar = (n: number) => {
    const fatia = base.slice(cursor, cursor + n);
    cursor += n;
    return fatia;
  };
  return base.slice(0, 6).map((gestor, g) => ({
    ...gestor,
    equipe: pegar(3 + (g % 3)).map((membro, m) => (m === 0 ? { ...membro, equipe: pegar(2) } : membro))
  }));
}

export const TONS_SITUACAO = {
  Ativo: 'success',
  Férias: 'info',
  Afastado: 'warning',
  Desligado: 'danger'
} as const;

export const TONS_PEDIDO = {
  Pago: 'success',
  Enviado: 'info',
  Pendente: 'warning',
  Cancelado: 'danger'
} as const;
