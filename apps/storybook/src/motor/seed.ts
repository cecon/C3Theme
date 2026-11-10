// Registros do adaptador em memória: o "backend" das histórias. Ficam fora da spec porque são dados, não tela.

import type { MemorySeed, WireRecord } from '@c3theme/engine';

import { OPENAPI } from './openapi';
import { avisos, eventos, mesas, tarefas } from './operacao';
import { APP, ENTITIES } from './spec';

const NOMES = ['Ana Souza', 'Bruno Lima', 'Carla Mendes', 'Diego Araújo', 'Elisa Prado', 'Fábio Nogueira', 'Gisele Rocha'];
const CIDADES = [
  ['São Paulo', 'SP'],
  ['Campinas', 'SP'],
  ['Rio de Janeiro', 'RJ'],
  ['Belo Horizonte', 'MG'],
  ['Porto Alegre', 'RS']
];
const SITUACAO = ['ativo', 'ativo', 'pendente', 'ativo', 'inativo'];
const STATUS = ['paga', 'aberta', 'atrasada'];
const emissao = (i: number) => `2026-${String((i % 10) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`;
/** Vencimento 15 dias depois da emissão. */
const vencimento = (i: number) => {
  const d = new Date(`${emissao(i)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 15);
  return d.toISOString().slice(0, 10);
};

const clientes: WireRecord[] = NOMES.map((nome, i) => ({
  id: String(i + 1),
  nome,
  email: `${nome.split(' ')[0].toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')}@exemplo.com.br`,
  telefone: `1199${String(1000000 + i * 137).slice(0, 7)}`,
  cidade: CIDADES[i % CIDADES.length][0],
  uf: CIDADES[i % CIDADES.length][1],
  status: SITUACAO[i % SITUACAO.length]
}));

/** 42 faturas fixas (sem aleatório: a história fica igual a cada carga e o print não muda à toa). */
const faturas: WireRecord[] = Array.from({ length: 42 }, (_, i) => ({
  id: String(i + 1),
  numero: `FT-${String(i + 1).padStart(4, '0')}`,
  cliente: String((i % NOMES.length) + 1),
  emissao: emissao(i),
  vencimento: vencimento(i),
  total: (150 + ((i * 7919) % 4800) + (i % 4) * 0.25).toFixed(2),
  status: STATUS[(i * 5) % 3]
}));

/** Produtos da lista com edição na linha (preço e estoque em lote, ativo na hora). */
const produtos: WireRecord[] = ['Café torrado 500 g', 'Açúcar cristal 1 kg', 'Arroz tipo 1 5 kg', 'Feijão carioca 1 kg'].map((nome, i) => ({
  id: String(i + 1),
  nome,
  preco: (12.9 + i * 6.5).toFixed(2),
  estoque: 40 - i * 9,
  ativo: i !== 3
}));

/** Kardex de dois produtos: o saldo de cada linha é o acumulado depois do movimento (o `opening` lê o último). */
const movimentos: WireRecord[] = (() => {
  const saldo: Record<string, number> = {};
  const lances: [string, string, string, number][] = [
    ['2026-01-05', '1', 'Compra NF 1201', 50],
    ['2026-01-20', '2', 'Compra NF 1207', 30],
    ['2026-02-03', '1', 'Venda', -12],
    ['2026-02-18', '1', 'Venda', -8],
    ['2026-03-02', '2', 'Venda', -5],
    ['2026-03-04', '1', 'Compra NF 1290', 24],
    ['2026-03-15', '1', 'Venda', -16],
    ['2026-03-28', '1', 'Ajuste de inventário', -2]
  ];
  return lances.map(([data, produto, historico, quantidade], i) => {
    saldo[produto] = (saldo[produto] ?? 0) + quantidade;
    return { id: String(i + 1), data, produto, historico, quantidade, saldo: saldo[produto] };
  });
})();

export const SEED: MemorySeed = {
  app: APP,
  entities: ENTITIES,
  records: {
    cliente: clientes,
    produto: produtos,
    movimento: movimentos,
    inventario: [{ id: '1', descricao: 'Inventário de março', data: '2026-03-31' }],
    // o café e o feijão já foram contados; o resto falta
    inventario_item: produtos.map((p, i) => ({
      id: String(i + 1),
      inventario: '1',
      produto: p.id,
      codigo: `789100000${i + 1}`,
      esperado: p.estoque,
      contado: i % 2 ? p.estoque : null
    })),
    fatura: faturas,
    tarefa: tarefas,
    evento: eventos,
    mesa: mesas,
    vendedor: ['Hugo Martins', 'Íris Campos', 'João Pedro'].map((nome, i) => ({ id: String(i + 1), nome }))
  },
  // quem usa as histórias não cadastra vendedor: o campo que aponta para ele fica sem o "Cadastrar"
  capabilities: { vendedor: { create: false } },
  notifications: avisos,
  // o openapi.json da página `apiDocs` (/apis)
  files: { '/openapi.json': OPENAPI },
  // a regra que o backend do sistema teria
  actions: {
    fatura: {
      marcar_paga: () => ({ status: 'paga' }),
      reabrir: () => ({ status: 'aberta' }),
      cancelar: (fatura, input) => {
        if (fatura.numero === 'FT-0003') throw new Error('O banco já registrou o boleto desta fatura; dê baixa nele antes.');
        return { status: 'cancelada', motivo: input.motivo };
      }
    }
  }
};
