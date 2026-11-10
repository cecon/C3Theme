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

// Orçado × realizado (#56, #58): a situação de cada mês colore a célula do mês; o % do total é razão das somas.
const tri: [string, number[], number[]][] = [
  ['Aluguel', [8000, 8000, 8000], [8000, 8000, 8000]],
  ['Energia', [1200, 1200, 1200], [1150, 1290, 1480]],
  ['Marketing', [3000, 3000, 3000], [2100, 3600, 2800]],
  ['Folha', [42000, 42000, 42000], [41800, 42300, 45900]]
];
const situacao = (orcado: number, real: number) => (real > orcado * 1.1 ? 'ACIMA' : real > orcado ? 'ALERTA' : 'OK');
export const ORCADO_REALIZADO: WireRecord[] = tri.map(([conta, orc, real], i) => {
  const r: WireRecord = { id: String(i + 1), conta };
  orc.forEach((o, m) => {
    const mm = `0${m + 1}`;
    r[`orcado_${mm}`] = o.toFixed(2);
    r[`realizado_${mm}`] = real[m].toFixed(2);
    r[`situacao_${mm}`] = situacao(o, real[m]);
  });
  const o = orc.reduce((a, b) => a + b, 0);
  const re = real.reduce((a, b) => a + b, 0);
  return { ...r, orcado_ano: o.toFixed(2), realizado_ano: re.toFixed(2), percentual: ((re / o) * 100).toFixed(1) };
});

/** "Sugerir pela média" do orçamento (#57): a média do realizado da conta, pelo ano que está no formulário. */
export function mediaDaConta(conta: string, withValues: WireRecord): WireRecord {
  const base = 1000 + Number(conta) * 250 + (Number(withValues.ano) === 2026 ? 100 : 0);
  return { mes_01: base.toFixed(2), mes_02: (base * 1.02).toFixed(2), mes_03: (base * 1.04).toFixed(2) };
}
