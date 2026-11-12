// Regras dos widgets do painel por resumo (#108: meter, share, status) que o JSON Schema não expressa sozinho.

export const SUMMARY_TYPES = new Set(['meter', 'share', 'status']);

/**
 * Widget de resumo precisa de um `source` (o dele ou o do painel). No `status`, as ações têm id único; o caminho de
 * cada ação é do sistema, então só a forma é conferida no schema.
 */
export function checkSummaryWidget(dashboard, w, where, errors) {
  if (!w.source && !dashboard.source) errors.push(`${where}: sem source; declare dashboard.source ou o source do widget`);
  if (w.type !== 'status') return;
  const ids = new Set();
  for (const a of w.actions ?? []) {
    if (ids.has(a.id)) errors.push(`${where} actions: id '${a.id}' repetido`);
    ids.add(a.id);
  }
}
