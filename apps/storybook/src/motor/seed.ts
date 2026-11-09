// Registros do adaptador em memória: o "backend" das histórias. Ficam fora da spec porque são dados, não tela.

import type { MemorySeed, WireRecord } from '@c3theme/engine';

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

export const SEED: MemorySeed = {
  app: APP,
  entities: ENTITIES,
  records: {
    cliente: clientes,
    fatura: faturas,
    tarefa: tarefas,
    evento: eventos,
    mesa: mesas,
    vendedor: ['Hugo Martins', 'Íris Campos', 'João Pedro'].map((nome, i) => ({ id: String(i + 1), nome }))
  },
  // quem usa as histórias não cadastra vendedor: o campo que aponta para ele fica sem o "Cadastrar"
  capabilities: { vendedor: { create: false } },
  notifications: avisos,
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
