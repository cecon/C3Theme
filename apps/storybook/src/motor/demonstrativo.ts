// DRE gerencial (#60): consulta do sistema com um mês por coluna. As linhas têm os doze meses do calendário; as
// colunas, quem escolhe é a resposta, pelo período pedido (`meta.columns`), como o backend do sistema faria.

import type { WireRecord } from '@c3theme/engine';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Os meses de `de` até `ate` (no máximo 12), na ordem do período, com o ano no rótulo: `out/26`. */
export function colunasDoPeriodo(params: Record<string, string>): { field: string; label?: string }[] {
  const [y0, m0] = (params.de ?? '').split('-').map(Number);
  const [y1, m1] = (params.ate ?? '').split('-').map(Number);
  if (!y0 || !m0 || !y1 || !m1) return [{ field: 'conta' }];
  const out: { field: string; label?: string }[] = [{ field: 'conta' }];
  for (let y = y0, m = m0; (y < y1 || (y === y1 && m <= m1)) && out.length <= 12; m === 12 ? ((m = 1), y++) : m++) {
    out.push({ field: `mes_${String(m).padStart(2, '0')}`, label: `${MESES[m - 1]}/${String(y).slice(2)}` });
  }
  return out;
}

const linha = (id: number, conta: string, base: number, passo: number): WireRecord => ({
  id: String(id),
  conta,
  ...Object.fromEntries(MESES.map((_, i) => [`mes_${String(i + 1).padStart(2, '0')}`, (base + passo * i).toFixed(2)]))
});

const receita = linha(1, 'Receita líquida', 84000, 1500);
const custos = linha(2, 'Custos', -51000, -700);
const despesas = linha(3, 'Despesas', -26000, -900);
const resultado: WireRecord = {
  id: '4',
  conta: 'Resultado',
  ...Object.fromEntries(
    MESES.map((_, i) => {
      const k = `mes_${String(i + 1).padStart(2, '0')}`;
      return [k, (Number(receita[k]) + Number(custos[k]) + Number(despesas[k])).toFixed(2)];
    })
  )
};

export const DEMONSTRATIVO: WireRecord[] = [receita, custos, despesas, resultado];

/** Boletos do painel de vencimentos: vencem a N dias de hoje, então "Próximos 7/30 dias" sempre têm o que mostrar. */
const daqui = (dias: number) => {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const BOLETOS: WireRecord[] = [0, 2, 5, 9, 14, 21, 28, 35, 45, 60].map((dias, i) => ({
  id: String(i + 1),
  numero: `BL-${String(i + 1).padStart(3, '0')}`,
  cliente: String((i % 5) + 1),
  vencimento: daqui(dias),
  valor: (480 + ((i * 3571) % 2600)).toFixed(2)
}));
