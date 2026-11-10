// Balancete de exemplo (#54) e a revisão em etapas (#53): o que o backend do sistema faria, em memória.

import type { ActionResult, WireRecord } from '@c3theme/engine';

const linhas: [string, string, 'TITULO' | 'CONTA' | 'TOTAL', boolean, string][] = [
  ['1', 'ATIVO', 'TITULO', false, '48210.00'],
  ['1.1', 'Ativo circulante', 'CONTA', false, '48210.00'],
  ['1.1.01', 'Caixa', 'CONTA', true, '-1250.40'],
  ['1.1.02', 'Bancos', 'CONTA', true, '32460.40'],
  ['1.1.03', 'Clientes a receber', 'CONTA', true, '17000.00'],
  ['2', 'PASSIVO', 'TITULO', false, '-21980.00'],
  ['2.1.01', 'Fornecedores', 'CONTA', true, '-15480.00'],
  ['2.1.02', 'Impostos a recolher', 'CONTA', true, '-6500.00'],
  ['9', '(=) RESULTADO DO PERÍODO', 'TOTAL', false, '26230.00']
];

export const BALANCETE: WireRecord[] = linhas.map(([codigo, descricao, tipo, analitica, saldo], i) => ({
  id: String(i + 1),
  codigo,
  descricao,
  tipo,
  analitica,
  saldo
}));

const TOTAL = 300;
const LOTE = 15;
const pausa = () => new Promise((ok) => setTimeout(ok, 500));

/** "Revisar classificação": 300 NCMs em lotes de 15, meio segundo por lote, com os contadores parciais. */
export async function revisar(_input: WireRecord, cursor: unknown): Promise<ActionResult> {
  await pausa();
  const done = Math.min((typeof cursor === 'number' ? cursor : 0) + LOTE, TOTAL);
  const aplicados = Math.round(done * 0.7);
  const message = `Aplicados ${aplicados}, enviados para a fila ${done - aplicados}, erros 0.`;
  return { message: done === TOTAL ? `Revisão concluída: ${message}` : message, progress: { total: TOTAL, done, cursor: done } };
}
