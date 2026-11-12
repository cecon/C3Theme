// Relação de entregas (#66): a prévia é o texto do cupom da impressora térmica, uma linha por linha do papel, na
// coluna `format: "pre"`. O que o backend do sistema montaria, em memória.

import type { ActionPreview, WireRecord } from '@c3theme/engine';

const PEDIDOS: [number, string, string, string][] = [
  [1041, 'Ana Souza', 'Centro', '58.90'],
  [1042, 'Bruno Lima', 'Jardim América', '124.50'],
  [1045, 'Carla Mendes', 'Vila Nova', '37.00'],
  [1048, 'Diego Araújo', 'Centro', '212.30']
];

export const ENTREGAS: WireRecord[] = PEDIDOS.map(([pedido, cliente, bairro, valor], i) => ({
  id: String(i + 1),
  pedido,
  cliente,
  bairro,
  valor
}));

const LARGURA = 40;
const brl = (v: number) => v.toFixed(2).replace('.', ',');
/** Texto à esquerda e valor à direita, com pontilhado no meio: a coluna do cupom. */
const linha = (esq: string, dir: string) => `${esq} `.padEnd(LARGURA - dir.length - 1, '.') + ` ${dir}`;
const centro = (t: string) => t.padStart(Math.floor((LARGURA + t.length) / 2)).padEnd(LARGURA);

/** O cupom de 40 colunas: título espaçado, um pedido por linha com o valor à direita e o total. */
export function relacaoDeEntregas(): ActionPreview {
  const total = ENTREGAS.reduce((s, e) => s + Number(e.valor), 0);
  const texto = [
    '='.repeat(LARGURA),
    centro('R E L .   E N T R E G A S'),
    '='.repeat(LARGURA),
    ...ENTREGAS.flatMap((e) => [linha(`#${e.pedido} ${e.cliente}`, brl(Number(e.valor))), `   ${e.bairro}`]),
    '-'.repeat(LARGURA),
    linha(`${ENTREGAS.length} entregas`, brl(total))
  ];
  return {
    message: 'É assim que sai na impressora do balcão.',
    table: { columns: [{ name: 'linha', label: 'Relação', format: 'pre' }], rows: texto.map((l) => ({ linha: l })) }
  };
}

/** Dia `dia` (0 = domingo) da semana corrente, às `hora`: a agenda abre na semana de hoje, então os dados acompanham. */
const naSemana = (dia: number, hora: number) => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + dia);
  d.setHours(hora, 0, 0, 0);
  return d.toISOString();
};

/** Controle semanal (#65): os pedidos na hora da entrega; o atrasado sai em vermelho, seja qual for a situação. */
export const AGENDA: WireRecord[] = [
  [1, 9, 'P', true],
  [1, 14, 'F', false],
  [2, 10, 'O', false],
  [3, 11, 'P', false],
  [4, 16, 'F', false],
  [5, 9, 'P', false]
].map(([dia, hora, situacao, atrasado], i) => ({
  id: String(i + 1),
  titulo: `Pedido ${1041 + i}`,
  entrega_em: naSemana(dia as number, hora as number),
  situacao,
  atrasado,
  entrega: String((i % ENTREGAS.length) + 1)
}));
